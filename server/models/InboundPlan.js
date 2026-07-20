import mongoose from "mongoose";

const inboundPlanSchema = new mongoose.Schema(
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
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
    },
    batchName: {
      type: String,
      required: true,
      trim: true,
    },
    totalCartons: {
      type: Number,
      required: true,
    },
    expectedDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["in-transit", "arrived", "completed"],
      default: "in-transit",
    },
  },
  { timestamps: true }
);

const InboundPlan = mongoose.model("InboundPlan", inboundPlanSchema);

export default InboundPlan;