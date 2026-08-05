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
      enum: ["Pending Packing", "Packed", "Dispatched", "Delivered", "Cancelled"],
      default: "Pending Packing",
    },
    trackingId: {
      type: String,
      default: null,
    },
    dispatchTimestamp: {
      type: Date,
      default: null,
    },
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
