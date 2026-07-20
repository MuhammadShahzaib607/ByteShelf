import mongoose from "mongoose";

const warehouseSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    location: {
      type: String,
      required: true,
      trim: true,
    },
    latitude: {
      type: Number,
      required: true,
    },
    longitude: {
      type: Number,
      required: true,
    },
    totalShelves: {
      type: Number,
      default: 0,
    },
    pricePerShelf: {
      type: Number,
      required: true,
    },
    images: {
      type: [String],
      default: [],
    },
    shelfCounter: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

const Warehouse = mongoose.model("Warehouse", warehouseSchema);

export default Warehouse;