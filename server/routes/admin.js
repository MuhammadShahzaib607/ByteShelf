import express from "express";
import { getVerifications, updateUserVerificationStatus } from "../controllers/admin.js";
import { verifyToken } from "../utils/middlewares/verifyToken.js";
import { verifyAdmin } from "../utils/middlewares/verifyAdmin.js";

const router = express.Router();

// Unified endpoint with query params: status=all|pending|approved|rejected&search=query
router.get("/verifications", verifyToken, verifyAdmin, getVerifications);

// Keep legacy endpoint for backward compatibility
router.get("/pending-verifications", verifyToken, verifyAdmin, getVerifications);

// Status update — supports approved, rejected, pending
router.patch("/verifications/:userId/status", verifyToken, verifyAdmin, updateUserVerificationStatus);

// Keep legacy endpoint for backward compatibility
router.patch("/verify-user/:userId", verifyToken, verifyAdmin, updateUserVerificationStatus);

export default router;
