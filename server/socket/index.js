import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import Message from "../models/Message.js";
import Conversation from "../models/Conversation.js";
import User from "../models/User.js";

export const initializeSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: "*",
    },
  });

  // ─── Track online users: userId → Set<socketId> ─────────────────────────
  const onlineUsers = new Map();

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth.token;

      if (!token) {
        return next(new Error("Authentication token missing"));
      }

      const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
      socket.userId = decoded.id;
      next();
    } catch (error) {
      next(new Error("Invalid or expired token"));
    }
  });

  io.on("connection", async (socket) => {
    const userId = socket.userId;

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
        socket.emit("error_message", "Something went wrong");
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
        socket.emit("error_message", "Failed to mark messages as read");
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
    socket.on("disconnect", async () => {
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