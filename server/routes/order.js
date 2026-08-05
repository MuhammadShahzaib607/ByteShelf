import express from "express";
import multer from "multer";
import { verifyToken } from "../utils/middlewares/verifyToken.js";
import {
  createOrder,
  parsePdf,
  getMerchantStock,
  getMerchantOrders,
  getWarehouseOrders,
  getOrdersByWarehouse,
  markPacked,
  dispatchOrder,
  markInTransit,
  markDelivered,
} from "../controllers/order.js";

const router = express.Router();

// In-memory upload for PDF parsing (max 8MB)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
});

router.post("/create", verifyToken, createOrder);
router.post("/parse-pdf", verifyToken, upload.single("file"), parsePdf);
router.get("/stock", verifyToken, getMerchantStock);
router.get("/merchant-orders", verifyToken, getMerchantOrders);
router.get("/warehouse-orders", verifyToken, getWarehouseOrders);
router.get("/warehouse/:warehouseId", verifyToken, getOrdersByWarehouse);
router.patch("/:orderId/mark-packed", verifyToken, markPacked);
router.patch("/:orderId/dispatch", verifyToken, dispatchOrder);
router.patch("/:orderId/mark-in-transit", verifyToken, markInTransit);
router.patch("/:orderId/mark-delivered", verifyToken, markDelivered);

export default router;
