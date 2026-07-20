import mongoose from "mongoose";
import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import { sendRes } from "../utils/responseHandler.js";

export const startConversation = async (req, res) => {
  try {
    const { participantId, warehouseId } = req.body;

    if (!participantId) {
      return sendRes(res, 400, false, "Participant id is required");
    }

    if (participantId === req.user.id) {
      return sendRes(res, 400, false, "Cannot start a conversation with yourself");
    }

    let conversation = await Conversation.findOne({
      participants: { $all: [req.user.id, participantId], $size: 2 },
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [req.user.id, participantId],
        warehouse: warehouseId || null,
      });
    }

    return sendRes(res, 200, true, "Conversation fetched successfully", conversation);
  } catch (error) {
    return sendRes(res, 500, false, "Something went wrong");
  }
};

export const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: req.user.id,
    });

    if (!conversation) {
      return sendRes(res, 404, false, "Conversation not found");
    }

    const [messages, total] = await Promise.all([
      Message.find({ conversation: conversationId }).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Message.countDocuments({ conversation: conversationId }),
    ]);

    return sendRes(res, 200, true, "Messages fetched successfully", {
      messages,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalMessages: total,
    });
  } catch (error) {
    return sendRes(res, 500, false, "Something went wrong");
  }
};

export const getMyConversations = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);

    const conversations = await Conversation.aggregate([
      { $match: { participants: userId } },
      { $sort: { lastMessageAt: -1 } },
      {
        $lookup: {
          from: "messages",
          let: { convId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$conversation", "$$convId"] },
                    { $ne: ["$sender", userId] },
                    { $eq: ["$isRead", false] },
                  ],
                },
              },
            },
            { $count: "count" },
          ],
          as: "unreadInfo",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "participants",
          foreignField: "_id",
          as: "participantDetails",
        },
      },
      {
        $addFields: {
          unreadCount: { $ifNull: [{ $arrayElemAt: ["$unreadInfo.count", 0] }, 0] },
          participantDetails: {
            $map: {
              input: "$participantDetails",
              as: "p",
              in: { _id: "$$p._id", name: "$$p.name", role: "$$p.role" },
            },
          },
        },
      },
      {
        $project: {
          unreadInfo: 0,
        },
      },
    ]);

    return sendRes(res, 200, true, "Conversations fetched successfully", conversations);
  } catch (error) {
    return sendRes(res, 500, false, "Something went wrong");
  }
};

export const markMessagesAsRead = async (req, res) => {
  try {
    const { conversationId } = req.params;

    await Message.updateMany(
      { conversation: conversationId, sender: { $ne: req.user.id }, isRead: false },
      { $set: { isRead: true } }
    );

    return sendRes(res, 200, true, "Messages marked as read");
  } catch (error) {
    return sendRes(res, 500, false, "Something went wrong");
  }
};