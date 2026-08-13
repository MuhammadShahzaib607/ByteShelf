import express from "express";
import { getMyWarehouses } from "../controllers/warehouse.js";
import {
  getOwnerWarehouseInbounds,
  updateInboundStatus,
} from "../controllers/inboundPlan.js";
import { updateOwnerOrderStatus } from "../controllers/order.js";
import { verifyToken } from "../utils/middlewares/verifyToken.js";

const router = express.Router();

// ─── Warehouse Owner inbound management (spec: /api/v1/owner/*) ────────────────
// GET /api/v1/owner/warehouses — all warehouses belonging to the logged-in owner
router.get("/warehouses", verifyToken, getMyWarehouses);

// GET /api/v1/owner/warehouses/:warehouseId/inbounds — inbound plans + cartons
// for a specific owned warehouse
router.get("/warehouses/:warehouseId/inbounds", verifyToken, getOwnerWarehouseInbounds);

// PATCH /api/v1/owner/inbounds/:inboundId/status — mark a shipment as ARRIVED
router.patch("/inbounds/:inboundId/status", verifyToken, updateInboundStatus);

// PATCH /api/v1/owner/orders/:orderId/status — owner updates order status
router.patch("/orders/:orderId/status", verifyToken, updateOwnerOrderStatus);

export default router;
