import express from "express";
import { createWarehouse, editWarehouse, getAllWarehouses, getMyWarehouses, getWarehouseById } from "../controllers/warehouse.js";
import { verifyToken } from "../utils/middlewares/verifyToken.js";
import { verifyWarehouseOwner } from "../utils/middlewares/verifyWarehouseOwner.js";

const router = express.Router();

router.post("/create", verifyToken, createWarehouse);
router.get("/my-warehouses", verifyToken, getMyWarehouses);
router.put("/edit/:warehouseId", verifyToken, verifyWarehouseOwner, editWarehouse);
router.get("/all", verifyToken, getAllWarehouses);
router.get("/:warehouseId", verifyToken, getWarehouseById);

export default router;