import express from "express";
import {
  createInboundPlan,
  getMyInboundPlans,
  getInboundPlanDetails,
  getWarehouseInboundPlans,
} from "../controllers/inboundPlan.js";
import { verifyToken } from "../middlewares/verifyToken.js";
import { verifyWarehouseOwner } from "../middlewares/verifyWarehouseOwner.js";

const router = express.Router();

router.post("/create", verifyToken, createInboundPlan);
router.get("/my-plans", verifyToken, getMyInboundPlans);
router.get("/:inboundPlanId", verifyToken, getInboundPlanDetails);
router.get("/warehouse/:warehouseId", verifyToken, verifyWarehouseOwner, getWarehouseInboundPlans);

export default router;