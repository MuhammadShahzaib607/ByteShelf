import Carton from "../models/Carton.js";
import InboundPlan from "../models/InboundPlan.js";
import { sendRes } from "../utils/responseHandler.js";

export const scanCarton = async (req, res) => {
  try {
    const { cartonCode } = req.body;

    if (!cartonCode) {
      return sendRes(res, 400, false, "Carton code is required");
    }

    const carton = await Carton.findOne({ cartonCode });
    if (!carton) {
      return sendRes(res, 404, false, "Carton not found");
    }

    if (carton.status !== "in-transit") {
      return sendRes(res, 400, false, `Carton is already marked as ${carton.status}`);
    }

    carton.status = "arrived";
    await carton.save();

    // Increment received count on the InboundPlan
    await InboundPlan.findByIdAndUpdate(carton.inboundPlan, { $inc: { receivedCount: 1 } });

    const remaining = await Carton.countDocuments({ inboundPlan: carton.inboundPlan, status: "in-transit" });

    if (remaining === 0) {
      await InboundPlan.findByIdAndUpdate(carton.inboundPlan, { status: "arrived" });
    }

    return sendRes(res, 200, true, "Carton marked as arrived", carton);
  } catch (error) {
    console.error("[scanCarton] Error:", error.message);
    return sendRes(res, 500, false, "Something went wrong");
  }
};

// ─── Add cartons to an existing inbound plan (merchant only) ────────────────────

export const addCartons = async (req, res) => {
  try {
    const { inboundPlanId } = req.params;
    const { count } = req.body;

    if (!inboundPlanId) {
      return sendRes(res, 400, false, "Inbound plan ID is required");
    }

    const cartonCount = Number(count);
    if (!cartonCount || cartonCount < 1 || !Number.isInteger(cartonCount)) {
      return sendRes(res, 400, false, "Count must be a positive integer");
    }

    if (cartonCount > 100) {
      return sendRes(res, 400, false, "Cannot add more than 100 cartons at once");
    }

    // Fetch the inbound plan and verify ownership
    const plan = await InboundPlan.findById(inboundPlanId);
    if (!plan) {
      return sendRes(res, 404, false, "Inbound plan not found");
    }

    if (plan.merchant.toString() !== req.user.id) {
      return sendRes(res, 403, false, "You can only add cartons to your own inbound plans");
    }

    if (plan.status === "completed") {
      return sendRes(res, 400, false, "Cannot add cartons to a completed inbound plan");
    }

    // Find the highest existing carton index to generate new codes
    const existingCount = await Carton.countDocuments({ inboundPlan: inboundPlanId });
    const startIndex = existingCount + 1;

    // Create new cartons
    const newCartons = [];
    for (let i = 0; i < cartonCount; i++) {
      newCartons.push({
        inboundPlan: inboundPlanId,
        warehouse: plan.warehouse,
        cartonCode: `${inboundPlanId}-C${startIndex + i}`,
      });
    }

    await Carton.insertMany(newCartons);

    // Update totalCartons on the plan
    plan.totalCartons += cartonCount;
    await plan.save();

    return sendRes(res, 200, true, `${cartonCount} carton(s) added successfully`, {
      addedCount: cartonCount,
      totalCartons: plan.totalCartons,
      plan,
    });
  } catch (error) {
    console.error("[addCartons] Error:", error.message);
    return sendRes(res, 500, false, error.message || "Something went wrong");
  }
};