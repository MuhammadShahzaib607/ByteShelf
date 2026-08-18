import Booking from "../models/Booking.js";
import Notification from "../models/Notification.js";
import Shelf from "../models/Shelf.js";
import Warehouse from "../models/Warehouse.js";
import { sendRes } from "../utils/responseHandler.js";

export const createBooking = async (req, res) => {
  try {
    const { warehouseId, shelfIds, startDate, endDate } = req.body;
 
    if (!warehouseId || !shelfIds || !Array.isArray(shelfIds) || shelfIds.length === 0 || !startDate || !endDate) {
      return sendRes(res, 400, false, "All fields are required");
    }
 
    const start = new Date(startDate);
    const end = new Date(endDate);
 
    if (end <= start) {
      return sendRes(res, 400, false, "End date must be after start date");
    }
 
    const warehouse = await Warehouse.findById(warehouseId);
    if (!warehouse) {
      return sendRes(res, 404, false, "Warehouse not found");
    }
 
    const shelves = await Shelf.find({ _id: { $in: shelfIds } });
 
    if (shelves.length !== shelfIds.length) {
      return sendRes(res, 404, false, "One or more shelves not found");
    }
 
    const belongsToWarehouse = shelves.every((shelf) => shelf.warehouse.toString() === warehouseId);
    if (!belongsToWarehouse) {
      return sendRes(res, 400, false, "One or more shelves do not belong to the selected warehouse");
    }
 
    const updateResult = await Shelf.updateMany(
      { _id: { $in: shelfIds }, warehouse: warehouseId, status: "available" },
      { $set: { status: "booked" } }
    );
 
    if (updateResult.modifiedCount !== shelfIds.length) {
      await Shelf.updateMany(
        { _id: { $in: shelfIds }, warehouse: warehouseId, status: "booked", currentBooking: null },
        { $set: { status: "available" } }
      );
      return sendRes(res, 409, false, "One or more selected shelves are already booked");
    }
 
    const months = Math.ceil((end - start) / (1000 * 60 * 60 * 24 * 30));
    const pricePerShelf = shelves[0].pricePerMonth;
    const totalAmount = shelves.reduce((sum, shelf) => sum + shelf.pricePerMonth, 0) * months;
 
    const booking = await Booking.create({
      merchant: req.user.id,
      warehouse: warehouseId,
      shelves: shelfIds,
      startDate: start,
      endDate: end,
      status: "pending",
      totalAmount,
      pricePerShelf,
    });
 
    await Shelf.updateMany({ _id: { $in: shelfIds } }, { $set: { currentBooking: booking._id } });
 
    await Notification.create({
      recipient: warehouse.owner,
      sender: req.user.id,
      message: `New booking request for ${shelfIds.length} shelf(s) in ${warehouse.name}`,
      link: `/bookings/${booking._id}`,
    });
 
    return sendRes(res, 201, true, "Booking created successfully", booking);
  } catch (error) {
    console.error("[booking] Error:", error);
    return sendRes(res, 500, false, error.message || String(error), null, error);
  }
};

export const getWarehouseBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ warehouse: req.warehouse._id })
      .sort({ createdAt: -1 })
      .populate("shelves", "shelfNumber")
      .populate("merchant", "name phone email");

    return sendRes(res, 200, true, "Bookings fetched successfully", {
      bookings,
      total: bookings.length,
    });
  } catch (error) {
    console.error("[booking] Error:", error);
    return sendRes(res, 500, false, error.message || String(error), null, error);
  }
};

export const getWarehouseBookingDetails = async (req, res) => {
  try {
    const { bookingId } = req.params;

    const booking = await Booking.findOne({ _id: bookingId, warehouse: req.warehouse._id })
      .populate("shelves", "shelfNumber")
      .populate("merchant", "name phone");

    if (!booking) {
      return sendRes(res, 404, false, "Booking not found");
    }

    return sendRes(res, 200, true, "Booking details fetched successfully", booking);
  } catch (error) {
    console.error("[booking] Error:", error);
    return sendRes(res, 500, false, error.message || String(error), null, error);
  }
};

export const getMerchantBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ merchant: req.user.id })
      .sort({ createdAt: -1 })
      .populate("warehouse", "name location payoutDetails");

    return sendRes(res, 200, true, "Bookings fetched successfully", {
      bookings,
      total: bookings.length,
    });
  } catch (error) {
    console.error("[booking] Error:", error);
    return sendRes(res, 500, false, error.message || String(error), null, error);
  }
};

export const getMerchantBookingDetails = async (req, res) => {
  try {
    const { bookingId } = req.params;

    const booking = await Booking.findOne({ _id: bookingId, merchant: req.user.id })
      .populate("shelves", "shelfNumber")
      .populate({
        path: "warehouse",
        select: "name location latitude longitude owner payoutDetails",
        populate: { path: "owner", select: "_id name" },
      });

    if (!booking) {
      return sendRes(res, 404, false, "Booking not found");
    }

    return sendRes(res, 200, true, "Booking details fetched successfully", booking);
  } catch (error) {
    console.error("[booking] Error:", error);
    return sendRes(res, 500, false, error.message || String(error), null, error);
  }
};

// ─── Merchant payment proof upload ────────────────────────────────────────
// Merchant uploads a screenshot of their bank/wallet transfer. Flips the
// booking's payment status to "payment_submitted" for owner verification.
export const uploadPaymentProof = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const paymentProofUrl = String(req.body?.paymentProofUrl || "").trim();

    if (!paymentProofUrl) {
      return sendRes(res, 400, false, "Payment proof screenshot is required");
    }

    const booking = await Booking.findOne({ _id: bookingId, merchant: req.user.id });
    if (!booking) {
      return sendRes(res, 404, false, "Booking not found");
    }

    if (booking.status === "cancelled" || booking.status === "completed") {
      return sendRes(res, 400, false, "Payment proof cannot be uploaded for this booking");
    }

    booking.paymentProofUrl = paymentProofUrl;
    booking.paymentStatus = "payment_submitted";
    booking.paymentRejectionReason = "";
    await booking.save();

    const warehouse = await Warehouse.findById(booking.warehouse);

    await Notification.create({
      recipient: warehouse.owner,
      sender: req.user.id,
      title: "Payment Proof Uploaded",
      message: `${req.user.name || "A merchant"} uploaded a payment proof for booking ${booking._id}. Please verify the payment.`,
      link: `/dashboard`,
    });

    return sendRes(res, 200, true, "Payment proof submitted for verification", booking);
  } catch (error) {
    console.error("[booking] Error:", error);
    return sendRes(res, 500, false, error.message || String(error), null, error);
  }
};

// ─── Warehouse Owner payment verification ─────────────────────────────────
// Approve: paymentStatus -> paid and booking -> confirmed.
// Reject: paymentStatus -> payment_rejected with a saved rejection reason.
export const verifyPayment = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { verified, reason } = req.body;

    const booking = await Booking.findOne({ _id: bookingId, warehouse: req.warehouse._id });
    if (!booking) {
      return sendRes(res, 404, false, "Booking not found");
    }

    if (booking.paymentStatus !== "payment_submitted") {
      return sendRes(res, 400, false, "No payment proof is awaiting verification");
    }

    if (verified) {
      booking.paymentStatus = "paid";
      booking.paymentRejectionReason = "";
      booking.status = "confirmed";
      await booking.save();

      await Notification.create({
        recipient: booking.merchant,
        sender: req.user.id,
        title: "Payment Verified",
        message: "Your payment was verified. Your booking is now confirmed and inbound shipments are unlocked.",
        link: `/my-bookings/${booking._id}`,
      });

      return sendRes(res, 200, true, "Payment verified and booking confirmed", booking);
    }

    const rejectionReason = String(reason || "").trim();
    if (!rejectionReason) {
      return sendRes(res, 400, false, "A reason is required to reject the payment");
    }

    booking.paymentStatus = "payment_rejected";
    booking.paymentRejectionReason = rejectionReason;
    await booking.save();

    await Notification.create({
      recipient: booking.merchant,
      sender: req.user.id,
      title: "Payment Proof Rejected",
      message: `Your payment proof was rejected: ${rejectionReason}`,
      link: `/my-bookings/${booking._id}`,
    });

    return sendRes(res, 200, true, "Payment rejected", booking);
  } catch (error) {
    console.error("[booking] Error:", error);
    return sendRes(res, 500, false, error.message || String(error), null, error);
  }
};

// ─── Warehouse Owner approval workflow ────────────────────────────────────
// Confirm (approve) a PENDING booking request. Ownership of the warehouse is
// enforced by the verifyWarehouseOwner middleware (req.warehouse).
export const approveBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;

    const booking = await Booking.findOne({ _id: bookingId, warehouse: req.warehouse._id });
    if (!booking) {
      return sendRes(res, 404, false, "Booking not found");
    }

    if (booking.status !== "pending") {
      return sendRes(res, 400, false, "Only pending bookings can be confirmed");
    }

    booking.status = "confirmed";
    await booking.save();

    const warehouse = await Warehouse.findById(booking.warehouse);

    await Notification.create({
      recipient: booking.merchant,
      sender: req.user.id,
      title: "Booking Confirmed",
      message: `Your booking request for ${warehouse?.name || "the warehouse"} has been confirmed. You can now create inbound shipments.`,
      link: `/my-bookings/${booking._id}`,
    });

    return sendRes(res, 200, true, "Booking confirmed successfully", booking);
  } catch (error) {
    console.error("[booking] Error:", error);
    return sendRes(res, 500, false, error.message || String(error), null, error);
  }
};

// Decline (reject) a PENDING booking request. Releasing the reserved shelves
// back to "available" so other merchants can book them.
export const rejectBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const reason = String(req.body?.reason || "").trim();

    if (!reason) {
      return sendRes(res, 400, false, "A reason is required to decline a booking request");
    }

    const booking = await Booking.findOne({ _id: bookingId, warehouse: req.warehouse._id });
    if (!booking) {
      return sendRes(res, 404, false, "Booking not found");
    }

    if (booking.status !== "pending") {
      return sendRes(res, 400, false, "Only pending bookings can be rejected");
    }

    booking.status = "rejected";
    booking.cancellationReason = reason;
    await booking.save();

    // Release the reserved shelves back to available
    await Shelf.updateMany(
      { _id: { $in: booking.shelves } },
      { $set: { status: "available", currentBooking: null } }
    );

    const warehouse = await Warehouse.findById(booking.warehouse);

    await Notification.create({
      recipient: booking.merchant,
      sender: req.user.id,
      title: "Booking Request Declined",
      message: `Your booking request was declined by the warehouse owner: ${reason}`,
      link: `/my-bookings/${booking._id}`,
    });

    return sendRes(res, 200, true, "Booking rejected successfully", booking);
  } catch (error) {
    console.error("[booking] Error:", error);
    return sendRes(res, 500, false, error.message || String(error), null, error);
  }
};

export const cancelBookingByMerchant = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const reason = String(req.body?.reason || "").trim();

    if (!reason) {
      return sendRes(res, 400, false, "A reason is required to cancel a booking");
    }

    const booking = await Booking.findOne({ _id: bookingId, merchant: req.user.id });
    if (!booking) {
      return sendRes(res, 404, false, "Booking not found");
    }

    if (booking.status === "cancelled") {
      return sendRes(res, 400, false, "Booking is already cancelled");
    }

    if (booking.status === "completed") {
      return sendRes(res, 400, false, "Completed booking cannot be cancelled");
    }

    booking.status = "cancelled";
    booking.cancellationReason = reason;
    booking.endDate = new Date();
    await booking.save();

    await Shelf.updateMany(
      { _id: { $in: booking.shelves } },
      { $set: { status: "available", currentBooking: null } }
    );

    const warehouse = await Warehouse.findById(booking.warehouse);

    await Notification.create({
      recipient: warehouse.owner,
      sender: req.user.id,
      message: `Booking cancelled by merchant: ${reason}`,
      link: `/bookings/${booking._id}`,
    });

    return sendRes(res, 200, true, "Booking cancelled successfully", booking);
  } catch (error) {
    console.error("[booking] Error:", error);
    return sendRes(res, 500, false, error.message || String(error), null, error);
  }
};

export const cancelBookingByOwner = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const reason = String(req.body?.reason || "").trim();

    if (!reason) {
      return sendRes(res, 400, false, "A reason is required to cancel a booking");
    }

    const booking = await Booking.findOne({ _id: bookingId, warehouse: req.warehouse._id });
    if (!booking) {
      return sendRes(res, 404, false, "Booking not found");
    }

    if (booking.status === "cancelled") {
      return sendRes(res, 400, false, "Booking is already cancelled");
    }

    if (booking.status === "completed") {
      return sendRes(res, 400, false, "Completed booking cannot be cancelled");
    }

    booking.status = "cancelled";
    booking.cancellationReason = reason;
    booking.endDate = new Date();
    await booking.save();

    await Shelf.updateMany(
      { _id: { $in: booking.shelves } },
      { $set: { status: "available", currentBooking: null } }
    );

    await Notification.create({
      recipient: booking.merchant,
      sender: req.user.id,
      message: `Booking cancelled by warehouse owner: ${reason}`,
      link: `/bookings/${booking._id}`,
    });

    return sendRes(res, 200, true, "Booking cancelled successfully", booking);
  } catch (error) {
    console.log(error.message)
    return sendRes(res, 500, false, error.message || String(error), null, error);
  }
};

export const getOwnerBookings = async (req, res) => {
  try {
    const ownerId = req.user.id;

    // Find all warehouses owned by this user
    const warehouses = await Warehouse.find({ owner: ownerId }).select("_id name location");
    const warehouseIds = warehouses.map((w) => w._id);

    if (warehouseIds.length === 0) {
      return sendRes(res, 200, true, "Bookings fetched successfully", {
        bookings: [],
        total: 0,
        activeBookings: 0,
        pendingBookings: 0,
        totalRevenue: 0,
      });
    }

    const bookings = await Booking.find({ warehouse: { $in: warehouseIds } })
      .sort({ createdAt: -1 })
      .populate("shelves", "shelfNumber")
      .populate("merchant", "name phone email")
      .populate("warehouse", "name location");

    const activeBookings = bookings.filter((b) => b.status === "confirmed");
    const totalRevenue = activeBookings.reduce((sum, b) => sum + b.totalAmount, 0);
    const pendingBookings = bookings.filter((b) => b.status === "pending");

    return sendRes(res, 200, true, "Bookings fetched successfully", {
      bookings,
      total: bookings.length,
      activeBookings: activeBookings.length,
      pendingBookings: pendingBookings.length,
      totalRevenue,
    });
  } catch (error) {
    console.log(error.message);
    return sendRes(res, 500, false, error.message || String(error), null, error);
  }
};

export const markBookingAsPaid = async (req, res) => {
  try {
    const { bookingId } = req.params;
 
    const booking = await Booking.findOne({ _id: bookingId, warehouse: req.warehouse._id });
    if (!booking) {
      return sendRes(res, 404, false, "Booking not found");
    }
 
    if (booking.status === "cancelled") {
      return sendRes(res, 400, false, "Cancelled booking cannot be marked as paid");
    }
 
    if (booking.paymentStatus === "paid") {
      return sendRes(res, 400, false, "Booking is already marked as paid");
    }
 
    booking.paymentStatus = "paid";
    await booking.save();
 
    return sendRes(res, 200, true, "Booking marked as paid successfully", booking);
  } catch (error) {
    console.error("[booking] Error:", error);
    return sendRes(res, 500, false, error.message || String(error), null, error);
  }
};
