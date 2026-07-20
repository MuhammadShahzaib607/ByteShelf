import express from "express"
import { verifyToken } from "../utils/middlewares/verifyToken.js";
import { cancelBookingByMerchant, cancelBookingByOwner, createBooking, getMerchantBookingDetails, getMerchantBookings, getWarehouseBookingDetails, getWarehouseBookings, markBookingAsPaid } from "../controllers/booking.js";
import { verifyWarehouseOwner } from "../utils/middlewares/verifyWarehouseOwner.js";

const router = express.Router()

router.post("/create", verifyToken, createBooking);
router.get("/warehouse/:warehouseId", verifyToken, verifyWarehouseOwner, getWarehouseBookings);
router.get("/warehouse/:warehouseId/:bookingId", verifyToken, verifyWarehouseOwner, getWarehouseBookingDetails);
router.get("/my-bookings", verifyToken, getMerchantBookings);
router.get("/my-bookings/:bookingId", verifyToken, getMerchantBookingDetails);
router.patch("/cancel/:bookingId", verifyToken, cancelBookingByMerchant);
router.patch("/warehouse/:warehouseId/cancel/:bookingId", verifyToken, verifyWarehouseOwner, cancelBookingByOwner);
router.patch("/warehouse/:warehouseId/mark-paid/:bookingId", verifyToken, verifyWarehouseOwner, markBookingAsPaid);

export default router;