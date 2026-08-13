import express from "express";
import {
  createInboundPlan,
  getMyInboundPlans,
  getInboundPlanDetails,
  getWarehouseInboundPlans,
  getOwnerInboundPlans,
} from "../controllers/inboundPlan.js";
import { verifyToken } from "../utils/middlewares/verifyToken.js";
import { verifyWarehouseOwner } from "../utils/middlewares/verifyWarehouseOwner.js";

const router = express.Router();

router.post("/create", verifyToken, createInboundPlan);
router.get("/my-plans", verifyToken, getMyInboundPlans);
// Owner-wide inbound list (warehouse owners) — MUST be registered before "/:inboundPlanId"
router.get("/owner", verifyToken, getOwnerInboundPlans);
router.get("/:inboundPlanId", verifyToken, getInboundPlanDetails);
router.get("/warehouse/:warehouseId", verifyToken, verifyWarehouseOwner, getWarehouseInboundPlans);

export default router;