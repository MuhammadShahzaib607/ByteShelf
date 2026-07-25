import express from "express";
import { getPendingVerifications, verifyUser } from "../controllers/admin.js";
import { verifyToken } from "../utils/middlewares/verifyToken.js";
import { verifyAdmin } from "../utils/middlewares/verifyAdmin.js";

const router = express.Router();

router.get("/pending-verifications", verifyToken, verifyAdmin, getPendingVerifications);
router.patch("/verify-user/:userId", verifyToken, verifyAdmin, verifyUser);

export default router;
