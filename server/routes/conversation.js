import express from "express";
import { startConversation, getMessages, getMyConversations, markMessagesAsRead } from "../controllers/conversation.js";
import { verifyToken } from "../middlewares/verifyToken.js";

const router = express.Router();

router.post("/start", verifyToken, startConversation);
router.get("/my-conversations", verifyToken, getMyConversations);
router.get("/:conversationId/messages", verifyToken, getMessages);
router.patch("/:conversationId/mark-read", verifyToken, markMessagesAsRead);

export default router;