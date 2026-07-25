import express from "express";
import { addShelves, deleteShelves, getAvailableShelves, getBookedShelvesByWarehouse, getWarehouseShelves } from "../controllers/shelf.js";
import { verifyToken } from "../utils/middlewares/verifyToken.js";
import { verifyWarehouseOwner } from "../utils/middlewares/verifyWarehouseOwner.js";

const router = express.Router();

router.post("/add/:warehouseId", verifyToken, verifyWarehouseOwner, addShelves);
router.get("/:warehouseId", verifyToken, verifyWarehouseOwner, getWarehouseShelves);
router.delete("/:warehouseId", verifyToken, verifyWarehouseOwner, deleteShelves);
router.get("/warehouse/:warehouseId/available", verifyToken, getAvailableShelves);
router.get("/:warehouseId/booked", verifyToken, verifyWarehouseOwner, getBookedShelvesByWarehouse);

export default router;