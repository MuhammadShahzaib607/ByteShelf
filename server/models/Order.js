import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
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
    inboundPlan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "InboundPlan",
      default: null,
    },
    customerDetails: {
      name: { type: String, required: true, trim: true },
      phone: { type: String, required: true, trim: true },
      address: { type: String, required: true, trim: true },
      city: { type: String, required: true, trim: true },
    },
    orderedItems: [
      {
        itemName: { type: String, required: true, trim: true },
        sku: { type: String, default: "", trim: true },
        quantity: { type: Number, required: true, min: 1 },
      },
    ],
    status: {
      type: String,
      enum: ["Pending Packing", "Packed", "Dispatched", "In Transit", "Delivered", "Cancelled"],
      default: "Pending Packing",
    },
    // Legacy flat tracking fields (kept for backward compatibility)
    trackingId: {
      type: String,
      default: null,
    },
    dispatchTimestamp: {
      type: Date,
      default: null,
    },
    deliveredAt: {
      type: Date,
      default: null,
    },
    // Courier & post-packing tracking details
    courierDetails: {
      courierName: { type: String, default: "", trim: true },
      trackingId: { type: String, default: "", trim: true },
      trackingUrl: { type: String, default: "", trim: true },
    },
    // Order lifecycle timeline (status milestones with timestamps & notes)
    timeline: [
      {
        status: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
        note: { type: String, default: "", trim: true },
      },
    ],
    source: {
      type: String,
      enum: ["Manual", "AI_PDF_Extraction"],
      default: "Manual",
    },
  },
  { timestamps: true }
);

const Order = mongoose.model("Order", orderSchema);

export default Order;
