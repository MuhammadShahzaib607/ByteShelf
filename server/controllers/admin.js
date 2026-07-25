import User from "../models/User.js";
import { sendRes } from "../utils/responseHandler.js";

// ─── GET /api/v1/admin/pending-verifications ──────────────────────────────────
export const getPendingVerifications = async (req, res) => {
  try {
    const pendingUsers = await User.find({ verificationStatus: "pending" })
      .select("-password -otp -otpExpiry")
      .sort({ createdAt: -1 });

    return sendRes(res, 200, true, "Pending verifications fetched", pendingUsers);
  } catch (error) {
    return sendRes(res, 500, false, "Something went wrong");
  }
};

// ─── PATCH /api/v1/admin/verify-user/:userId ──────────────────────────────────
export const verifyUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { status, reason } = req.body;

    if (!status || !["approved", "rejected"].includes(status)) {
      return sendRes(res, 400, false, "Status must be 'approved' or 'rejected'");
    }

    if (status === "rejected" && !reason) {
      return sendRes(res, 400, false, "Rejection reason is required");
    }

    const user = await User.findById(userId);
    if (!user) {
      return sendRes(res, 404, false, "User not found");
    }

    if (user.verificationStatus !== "pending") {
      return sendRes(res, 400, false, `User is already ${user.verificationStatus}`);
    }

    user.verificationStatus = status;
    user.isVerified = status === "approved";

    if (status === "rejected") {
      user.rejectionReason = reason || "";
    }

    await user.save();

    return sendRes(
      res,
      200,
      true,
      `User ${status === "approved" ? "approved" : "rejected"} successfully`,
      { userId: user._id, verificationStatus: user.verificationStatus, isVerified: user.isVerified }
    );
  } catch (error) {
    return sendRes(res, 500, false, "Something went wrong");
  }
};
