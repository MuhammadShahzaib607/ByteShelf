import mongoose from "mongoose";

const kycDocumentsSchema = new mongoose.Schema({
  nicFront: { type: String, required: true },
  nicBack: { type: String, required: true },
  livePhoto: { type: String, required: true },
  liveVideo: { type: String, required: true },
}, { _id: false });

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: false,
    },
    role: {
      type: String,
      enum: ["merchant", "warehouseOwner", "worker", "admin"],
      required: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    verificationStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
    rejectionReason: {
      type: String,
      default: "",
    },
    kycDocuments: {
      type: kycDocumentsSchema,
      required: false,
    },
    otp: {
      type: String,
      default: null,
    },
    otpExpiry: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

export default User;