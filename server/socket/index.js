import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import Message from "../models/Message.js";
import Conversation from "../models/Conversation.js";
import User from "../models/User.js";
import { ensureDbConnected } from "../config/db.js";

/**
 * Wire the full Socket.io server (JWT auth, rooms, chat persistence, typing,
 * read receipts, presence) onto an http.Server.
 *
 * `options` are merged over serverless-safe defaults, so the caller decides the
 * engine details (path / transports / cors / ping timing):
 *  - server/api/socket.js → dedicated Vercel serverless function (production)
 *  - server/index.js       → local dev (NODE_ENV !== "production")
 */
export const initializeSocket = (server, options = {}) => {
  const io = new Server(server, {
    // Polling-first with WebSocket upgrade: the dedicated socket function
    // (api/socket.js) supports upgrades on Vercel Fluid Compute, while
    // long-polling stays as the automatic fallback.
    transports: ["polling", "websocket"],
    // Generous keep-alive timing so connections survive serverless cycles.
    pingTimeout: 60000,
    pingInterval: 25000,
    cors: {
      // `credentials: true` (sent by the client's polling requests) requires
      // explicit origins — a wildcard "*" is NOT allowed with credentials.
      origin: [
        process.env.CLIENT_URL,
        "https://byte-shelf-frontend.vercel.app",
        "http://localhost:3000",
      ].filter(Boolean),
      methods: ["GET", "POST"],
      credentials: true,
    },
    ...options,
  });

  // ─── Track online users: userId → Set<socketId> ─────────────────────────
  const onlineUsers = new Map();

  io.use(async (socket, next) => {
    try {
      // Serverless-safe: guarantee a warm MongoDB connection before any model
      // work. Reuses the cached connection across lambda invocations.
      await ensureDbConnected();

      const token = socket.handshake.auth.token;

      if (!token) {
        return next(new Error("Authentication token missing"));
      }

      const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
      socket.userId = decoded.id;
      next();
    } catch (error) {
      // Log the REAL cause — an auth failure and a MongoDB outage look identical
      // to clients, so silence here makes production socket outages impossible
      // to diagnose.
      console.error("[socket:auth] Error:", error);
      next(new Error("Invalid or expired token"));
    }
  });

  io.on("connection", async (socket) => {
    const userId = socket.userId;
    console.log("⚡ Socket connected:", socket.id, "userId:", userId);

    // ─── Track online status ───────────────────────────────────────────────
    if (!onlineUsers.has(userId)) {
      onlineUsers.set(userId, new Set());
    }
    onlineUsers.get(userId).add(socket.id);

    await User.findByIdAndUpdate(userId, { isOnline: true, lastSeen: new Date() });

    // Broadcast to all connected clients that this user is online
    socket.broadcast.emit("user_status", { userId, isOnline: true });

    // Send the list of currently active/online users back to the joining user
    // so they instantly know who else is online (fixes two-way sync)
    const activeUserIds = Array.from(onlineUsers.keys());
    socket.emit("active_users_list", activeUserIds);

    socket.on("join_conversation", (conversationId) => {
      socket.join(conversationId);
    });

    socket.on("send_message", async ({ conversationId, text, attachments }) => {
      try {
        const message = await Message.create({
          conversation: conversationId,
          sender: socket.userId,
          text: text || "",
          attachments: attachments || [],
        });

        await Conversation.findByIdAndUpdate(conversationId, {
          lastMessage: text || (attachments?.length ? "📎 Attachment" : ""),
          lastMessageAt: new Date(),
        });

        io.to(conversationId).emit("receive_message", message);
      } catch (error) {
        console.error("[socket:send_message] Error:", error);
        socket.emit("error_message", error.message || String(error));
      }
    });

    socket.on("message_read", async ({ conversationId }) => {
      try {
        await Message.updateMany(
          {
            conversation: conversationId,
            sender: { $ne: socket.userId },
            isRead: false,
          },
          { $set: { isRead: true } }
        );

        io.to(conversationId).emit("messages_read", {
          conversationId,
          readBy: socket.userId,
        });
      } catch (error) {
        console.error("[socket:message_read] Error:", error);
        socket.emit("error_message", error.message || String(error));
      }
    });

    // ─── Typing Indicator ───────────────────────────────────────────────────
    socket.on("typing_start", ({ conversationId }) => {
      socket.to(conversationId).emit("user_typing", {
        conversationId,
        userId: socket.userId,
        isTyping: true,
      });
    });

    socket.on("typing_stop", ({ conversationId }) => {
      socket.to(conversationId).emit("user_typing", {
        conversationId,
        userId: socket.userId,
        isTyping: false,
      });
    });

    // ─── Handle disconnect ─────────────────────────────────────────────────
    socket.on("disconnect", async (reason) => {
      console.log("⚠️ Socket disconnected:", socket.id, "reason:", reason);
      const userSockets = onlineUsers.get(userId);
      if (userSockets) {
        userSockets.delete(socket.id);
        if (userSockets.size === 0) {
          onlineUsers.delete(userId);
          const lastSeen = new Date();
          await User.findByIdAndUpdate(userId, { isOnline: false, lastSeen });
          socket.broadcast.emit("user_status", { userId, isOnline: false, lastSeen });
        }
      }
    });
  });

  return io;
};