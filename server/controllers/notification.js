import mongoose from "mongoose";
import Notification from "../models/Notification.js";
import { sendRes } from "../utils/responseHandler.js";

export const getMyNotifications = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);

    const { limit, status } = req.query;

    // Optional limit (e.g. ?limit=4 for the navbar dropdown) and status filter
    // (?status=unread). The limit applies to the returned list only — meta
    // counts (total/read/unread) always reflect the full set.
    const parsedLimit = limit ? parseInt(limit, 10) : null;
    const match =
      status === "unread"
        ? { $or: [{ recipient: userId }, { sender: userId }], isRead: false }
        : { $or: [{ recipient: userId }, { sender: userId }] };

    const result = await Notification.aggregate([
      { $match: match },
      {
        $facet: {
          notifications: [
            { $sort: { createdAt: -1 } },
            ...(parsedLimit && parsedLimit > 0
              ? [{ $limit: parsedLimit }]
              : []),
          ],
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
    console.error("[notification] Error:", error);
    return sendRes(res, 500, false, error.message || String(error), null, error);
  }
};

export const markNotificationAsRead = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return sendRes(res, 400, false, "Notification id is required");
    }

    const result = await Notification.updateOne(
      {
        _id: id,
        $or: [{ recipient: req.user.id }, { sender: req.user.id }],
      },
      { $set: { isRead: true } }
    );

    if (result.matchedCount === 0) {
      return sendRes(res, 404, false, "Notification not found");
    }

    return sendRes(res, 200, true, "Notification marked as read");
  } catch (error) {
    console.error("[notification] Error:", error);
    return sendRes(res, 500, false, error.message || String(error), null, error);
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
    console.error("[notification] Error:", error);
    return sendRes(res, 500, false, error.message || String(error), null, error);
  }
};

export const markAllNotificationsAsRead = async (req, res) => {
  try {
    // Mark all unread notifications for this user (recipient OR sender) — matches getMyNotifications scope
    await Notification.updateMany(
      {
        $or: [{ recipient: req.user.id }, { sender: req.user.id }],
        isRead: false,
      },
      { $set: { isRead: true } }
    );

    return sendRes(res, 200, true, "All notifications marked as read");
  } catch (error) {
    console.error("[notification] Error:", error);
    return sendRes(res, 500, false, error.message || String(error), null, error);
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
    console.error("[notification] Error:", error);
    return sendRes(res, 500, false, error.message || String(error), null, error);
  }
}; 