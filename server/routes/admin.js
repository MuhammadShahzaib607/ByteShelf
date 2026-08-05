import express from "express";
import { getVerifications, updateUserVerificationStatus, getAdminContact } from "../controllers/admin.js";
import { verifyToken } from "../utils/middlewares/verifyToken.js";
import { verifyAdmin } from "../utils/middlewares/verifyAdmin.js";

const router = express.Router();

// Public (token-only): Get first admin for chat contact
router.get("/contact", verifyToken, getAdminContact);

// Admin-only: Unified endpoint with query params: status=all|pending|approved|rejected&search=query
router.get("/verifications", verifyToken, verifyAdmin, getVerifications);

// Keep legacy endpoint for backward compatibility
router.get("/pending-verifications", verifyToken, verifyAdmin, getVerifications);

// Status update — supports approved, rejected, pending
router.patch("/verifications/:userId/status", verifyToken, verifyAdmin, updateUserVerificationStatus);

// Keep legacy endpoint for backward compatibility
router.patch("/verify-user/:userId", verifyToken, verifyAdmin, updateUserVerificationStatus);

export default router;