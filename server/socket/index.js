import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import Message from "../models/Message.js";
import Conversation from "../models/Conversation.js";

export const initializeSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: "*",
    },
  });

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

  io.on("connection", (socket) => {
    socket.on("join_conversation", (conversationId) => {
      socket.join(conversationId);
    });

    socket.on("send_message", async ({ conversationId, text }) => {
      try {
        const message = await Message.create({
          conversation: conversationId,
          sender: socket.userId,
          text,
        });

        await Conversation.findByIdAndUpdate(conversationId, {
          lastMessage: text,
          lastMessageAt: new Date(),
        });

        // Broadcast to ALL participants in the room (receiver + sender)
        io.to(conversationId).emit("receive_message", message);
      } catch (error) {
        socket.emit("error_message", "Something went wrong");
      }
    });

    socket.on("message_read", async ({ conversationId }) => {
      try {
        // Mark all unread messages sent by other participants as read
        await Message.updateMany(
          {
            conversation: conversationId,
            sender: { $ne: socket.userId },
            isRead: false,
          },
          { $set: { isRead: true } }
        );

        // Notify the conversation room that messages were read
        io.to(conversationId).emit("messages_read", {
          conversationId,
          readBy: socket.userId,
        });
      } catch (error) {
        socket.emit("error_message", "Failed to mark messages as read");
      }
    });
  });

  return io;
};