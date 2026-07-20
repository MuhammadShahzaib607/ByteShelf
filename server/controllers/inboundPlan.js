import mongoose from "mongoose";
import InboundPlan from "../models/InboundPlan.js";
import Carton from "../models/Carton.js";
import Booking from "../models/Booking.js";
import { sendRes } from "../utils/responseHandler.js";

export const createInboundPlan = async (req, res) => {
  try {
    const { bookingId, batchName, totalCartons, expectedDate } = req.body;

    if (!bookingId || !batchName || !totalCartons || !expectedDate) {
      return sendRes(res, 400, false, "All fields are required");
    }

    if (totalCartons <= 0) {
      return sendRes(res, 400, false, "Total cartons must be greater than 0");
    }

    const booking = await Booking.findOne({ _id: bookingId, merchant: req.user.id });
    if (!booking) {
      return sendRes(res, 404, false, "Booking not found");
    }

    if (booking.status !== "confirmed") {
      return sendRes(res, 400, false, "Booking is not active");
    }

    if (new Date(booking.endDate) < new Date()) {
      return sendRes(res, 400, false, "Booking has expired");
    }

    const inboundPlan = await InboundPlan.create({
      merchant: req.user.id,
      warehouse: booking.warehouse,
      booking: booking._id,
      batchName: batchName.trim(),
      totalCartons,
      expectedDate,
    });

    const cartons = [];
    for (let i = 1; i <= totalCartons; i++) {
      cartons.push({
        inboundPlan: inboundPlan._id,
        warehouse: booking.warehouse,
        cartonCode: `${inboundPlan._id}-C${i}`,
      });
    }

    await Carton.insertMany(cartons);

    return sendRes(res, 201, true, "Inbound plan created successfully", inboundPlan);
  } catch (error) {
    return sendRes(res, 500, false, "Something went wrong");
  }
};

export const getMyInboundPlans = async (req, res) => {
  try {
    const plans = await InboundPlan.aggregate([
      { $match: { merchant: new mongoose.Types.ObjectId(req.user.id) } },
      { $sort: { createdAt: -1 } },
      {
        $lookup: {
          from: "cartons",
          let: { planId: "$_id" },
          pipeline: [
            { $match: { $expr: { $eq: ["$inboundPlan", "$$planId"] } } },
            { $group: { _id: "$status", count: { $sum: 1 } } },
          ],
          as: "cartonStats",
        },
      },
    ]);

    return sendRes(res, 200, true, "Inbound plans fetched successfully", plans);
  } catch (error) {
    return sendRes(res, 500, false, "Something went wrong");
  }
};

export const getInboundPlanDetails = async (req, res) => {
  try {
    const { inboundPlanId } = req.params;

    const plan = await InboundPlan.findOne({ _id: inboundPlanId, merchant: req.user.id });
    if (!plan) {
      return sendRes(res, 404, false, "Inbound plan not found");
    }

    const cartons = await Carton.find({ inboundPlan: inboundPlanId }).sort({ createdAt: 1 });

    return sendRes(res, 200, true, "Inbound plan details fetched successfully", { plan, cartons });
  } catch (error) {
    return sendRes(res, 500, false, "Something went wrong");
  }
};

export const getWarehouseInboundPlans = async (req, res) => {
  try {
    const plans = await InboundPlan.find({ warehouse: req.warehouse._id }).sort({ createdAt: -1 });

    return sendRes(res, 200, true, "Inbound plans fetched successfully", plans);
  } catch (error) {
    return sendRes(res, 500, false, "Something went wrong");
  }
};