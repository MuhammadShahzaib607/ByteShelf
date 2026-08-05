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
    receivedCount: {
      type: Number,
      default: 0,
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
    // Declared per-carton contents (merchant-defined inventory breakdown)
    cartons: {
      type: [
        {
          cartonNumber: { type: String, trim: true },
          items: [
            {
              itemName: { type: String, trim: true },
              sku: { type: String, trim: true, default: "" },
              quantity: { type: Number, default: 0 },
            },
          ],
          status: {
            type: String,
            enum: ["In Storage", "Unpacked", "Dispatched"],
            default: "In Storage",
          },
          totalItemsCount: { type: Number, default: 0 },
        },
      ],
      default: [],
    },
    // Per-item stock ledger — single source of truth for available units.
    // initialUnits = total cartons × items per carton (at creation time).
    // dispatchedUnits grows as orders deduct from this inbound's stock.
    // availableUnits = initialUnits − dispatchedUnits.
    stock: {
      type: [
        {
          itemName: { type: String, trim: true },
          sku: { type: String, trim: true, default: "" },
          initialUnits: { type: Number, default: 0 },
          dispatchedUnits: { type: Number, default: 0 },
          availableUnits: { type: Number, default: 0 },
        },
      ],
      default: [],
    },
  },
  { timestamps: true }
);

const InboundPlan = mongoose.model("InboundPlan", inboundPlanSchema);

export default InboundPlan;