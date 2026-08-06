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
    return sendRes(res, 500, false, error.message || String(error), null, error);
  }
};
