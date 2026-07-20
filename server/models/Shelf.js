import mongoose from "mongoose";

const shelfSchema = new mongoose.Schema(
  {
    warehouse: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Warehouse",
      required: true,
    },
    shelfNumber: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["available", "booked"],
      default: "available",
    },
    pricePerMonth: {
      type: Number,
      required: true,
    },
    currentBooking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      default: null,
    },
  },
  { timestamps: true }
);

const Shelf = mongoose.model("Shelf", shelfSchema);

export default Shelf;