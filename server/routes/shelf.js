import express from "express";
import { addShelves, createShelf, deleteShelves, deleteShelf, getAvailableShelves, getBookedShelvesByWarehouse, getWarehouseShelves, updateShelf } from "../controllers/shelf.js";
import { verifyToken } from "../utils/middlewares/verifyToken.js";
import { verifyWarehouseOwner } from "../utils/middlewares/verifyWarehouseOwner.js";

const router = express.Router();

router.post("/add/:warehouseId", verifyToken, verifyWarehouseOwner, addShelves);
router.post("/create/:warehouseId", verifyToken, verifyWarehouseOwner, createShelf);
router.patch("/update/:shelfId", verifyToken, updateShelf);
router.delete("/single/:shelfId", verifyToken, deleteShelf);
router.get("/:warehouseId", verifyToken, verifyWarehouseOwner, getWarehouseShelves);
router.delete("/:warehouseId", verifyToken, verifyWarehouseOwner, deleteShelves);
router.get("/warehouse/:warehouseId/available", verifyToken, getAvailableShelves);
router.get("/:warehouseId/booked", verifyToken, verifyWarehouseOwner, getBookedShelvesByWarehouse);

export default router;