import mongoose from "mongoose";
import Notification from "../models/Notification.js";
import { sendRes } from "../utils/responseHandler.js";

export const getMyNotifications = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);

    const result = await Notification.aggregate([
      { $match: { $or: [{ recipient: userId }, { sender: userId }] } },
      {
        $facet: {
          notifications: [{ $sort: { createdAt: -1 } }],
          meta: [
            {
              $group: {
                _id: null,
                total: { $sum: 1 },
                read: { $sum: { $cond: ["$isRead", 1, 0] } },
                unread: { $sum: { $cond: ["$isRead", 0, 1] } },
              },
            },
          ],
        },
      },
    ]);

    const notifications = result[0].notifications;
    const meta = result[0].meta[0] || { total: 0, read: 0, unread: 0 };

    return sendRes(res, 200, true, "Notifications fetched successfully", {
      notifications,
      total: meta.total,
      read: meta.read,
      unread: meta.unread,
    });
  } catch (error) {
    return sendRes(res, 500, false, "Something went wrong");
  }
};

export const markNotificationsAsRead = async (req, res) => {
  try {
    const { notificationIds } = req.body;

    if (!notificationIds || !Array.isArray(notificationIds) || notificationIds.length === 0) {
      return sendRes(res, 400, false, "Notification id(s) are required");
    }

    await Notification.updateMany(
      { _id: { $in: notificationIds }, recipient: req.user.id },
      { $set: { isRead: true } }
    );

    return sendRes(res, 200, true, "Notifications marked as read");
  } catch (error) {
    return sendRes(res, 500, false, "Something went wrong");
  }
};

export const deleteNotifications = async (req, res) => {
  try {
    const { notificationIds } = req.body;

    if (!notificationIds || !Array.isArray(notificationIds) || notificationIds.length === 0) {
      return sendRes(res, 400, false, "Notification id(s) are required");
    }

    await Notification.deleteMany({ _id: { $in: notificationIds }, recipient: req.user.id });

    return sendRes(res, 200, true, "Notifications deleted successfully");
  } catch (error) {
    return sendRes(res, 500, false, "Something went wrong");
  }
}; 