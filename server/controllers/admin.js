import User from "../models/User.js";
import { sendRes } from "../utils/responseHandler.js";

// ─── GET /api/v1/admin/verifications ───────────────────────────────────────────
// Query params: status=all|pending|approved|rejected (default: pending), search=query
export const getVerifications = async (req, res) => {
  try {
    const { status = "pending", search = "" } = req.query;

    // Build the filter
    let filter = {};

    if (status !== "all") {
      filter.verificationStatus = status;
    }

    // Search by _id, name, or email
    if (search.trim()) {
      const searchRegex = new RegExp(search.trim(), "i");
      filter.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { _id: search.trim().match(/^[0-9a-fA-F]{24}$/) ? search.trim() : "__none__" },
      ];
    }

    const users = await User.find(filter)
      .select("-password -otp -otpExpiry")
      .sort({ createdAt: -1 });

    return sendRes(res, 200, true, "Verifications fetched", users);
  } catch (error) {
    console.error("getVerifications error:", error);
    return sendRes(res, 500, false, "Something went wrong");
  }
};

// ─── PATCH /api/v1/admin/verifications/:userId/status ───────────────────────────
// Set status to approved, rejected, or pending
export const updateUserVerificationStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const { status, reason } = req.body;

    if (!status || !["approved", "rejected", "pending"].includes(status)) {
      return sendRes(res, 400, false, "Status must be 'approved', 'rejected', or 'pending'");
    }

    if (status === "rejected" && !reason) {
      return sendRes(res, 400, false, "Rejection reason is required");
    }

    const user = await User.findById(userId);
    if (!user) {
      return sendRes(res, 404, false, "User not found");
    }

    user.verificationStatus = status;
    user.isVerified = status === "approved";

    if (status === "rejected") {
      user.rejectionReason = reason || "";
    } else {
      // Clear rejection reason when re-pending or approving
      user.rejectionReason = "";
    }

    await user.save();

    return sendRes(
      res,
      200,
      true,
      `User verification status updated to "${status}" successfully`,
      {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        verificationStatus: user.verificationStatus,
        isVerified: user.isVerified,
        rejectionReason: user.rejectionReason,
        kycDocuments: user.kycDocuments,
        createdAt: user.createdAt,
      }
    );
  } catch (error) {
    return sendRes(res, 500, false, "Something went wrong");
  }
};
