import express from "express";
import { deleteNotifications, getMyNotifications, markNotificationsAsRead } from "../controllers/notification.js";
import { verifyToken } from "../utils/middlewares/verifyToken.js";

const router = express.Router();

router.get("/my-notifications", verifyToken, getMyNotifications);
router.patch("/mark-read", verifyToken, markNotificationsAsRead);
router.delete("/delete", verifyToken, deleteNotifications);

export default router;