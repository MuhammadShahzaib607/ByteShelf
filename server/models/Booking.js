import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    merchant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    warehouse: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Warehouse",
      required: true,
    },
    shelves: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Shelf",
        required: true,
      },
    ],
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      // New bookings start as "pending" until the warehouse owner confirms them.
      enum: ["pending", "confirmed", "rejected", "cancelled", "completed"],
      default: "pending",
    },
    // Saved reason for why a booking was rejected or cancelled.
    cancellationReason: {
      type: String,
      default: "",
    },
    paymentStatus: {
      type: String,
      // "pending"/"unpaid" = merchant hasn't paid yet;
      // "payment_submitted" = merchant uploaded proof, awaiting owner verification;
      // "paid" = verified; "payment_rejected" = proof declined by owner.
      enum: ["pending", "unpaid", "payment_submitted", "paid", "payment_rejected"],
      default: "pending",
    },
    // Cloudinary / image URL of the merchant's payment transfer screenshot.
    paymentProofUrl: {
      type: String,
      default: "",
    },
    // All submitted payment proof screenshots (attempt history). Each upload
    // appends a URL, so the owner can review every attempt side-by-side.
    proofScreenshots: {
      type: [String],
      default: [],
    },
    // Reason saved when the owner rejects a submitted payment proof.
    paymentRejectionReason: {
      type: String,
      default: "",
    },
    // Number of payment proof screenshots the merchant has submitted (max 2).
    paymentAttemptsCount: {
      type: Number,
      default: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    pricePerShelf: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
);

const Booking = mongoose.model("Booking", bookingSchema);

export default Booking;