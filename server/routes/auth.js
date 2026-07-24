import express from "express";
import { signup, verifyOtp, resendOtp, login, refreshToken, getProfile, editProfile } from "../controllers/auth.js";
import { verifyToken } from "../utils/middlewares/verifyToken.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/verify-otp", verifyOtp);
router.post("/resend-otp", resendOtp);
router.post("/login", login);
router.post("/refresh-token", refreshToken);
router.get("/profile", verifyToken, getProfile);
router.patch("/edit-profile", verifyToken, editProfile);

export default router;