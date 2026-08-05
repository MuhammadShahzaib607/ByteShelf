import mongoose from "mongoose";

const cartonSchema = new mongoose.Schema(
  {
    inboundPlan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "InboundPlan",
      required: true,
    },
    warehouse: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Warehouse",
      required: true,
    },
    cartonCode: {
      type: String,
      required: true,
      unique: true,
    },
    status: {
      type: String,
      enum: ["in-transit", "arrived", "stored"],
      default: "in-transit",
    },
    shelf: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shelf",
      default: null,
    },
  },
  { timestamps: true }
);

const Carton = mongoose.model("Carton", cartonSchema);

export default Carton;