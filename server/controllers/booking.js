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
    return sendRes(res, 500, false, "Something went wrong");
  }
};

export const getWarehouseBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ warehouse: req.warehouse._id }).sort({ createdAt: -1 });

    return sendRes(res, 200, true, "Bookings fetched successfully", {
      bookings,
      total: bookings.length,
    });
  } catch (error) {
    return sendRes(res, 500, false, "Something went wrong");
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
    return sendRes(res, 500, false, "Something went wrong");
  }
};

export const getMerchantBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ merchant: req.user.id }).sort({ createdAt: -1 });

    return sendRes(res, 200, true, "Bookings fetched successfully", {
      bookings,
      total: bookings.length,
    });
  } catch (error) {
    return sendRes(res, 500, false, "Something went wrong");
  }
};

export const getMerchantBookingDetails = async (req, res) => {
  try {
    const { bookingId } = req.params;

    const booking = await Booking.findOne({ _id: bookingId, merchant: req.user.id })
      .populate("shelves", "shelfNumber")
      .populate({
        path: "warehouse",
        select: "name location latitude longitude owner",
        populate: { path: "owner", select: "_id name" },
      });

    if (!booking) {
      return sendRes(res, 404, false, "Booking not found");
    }

    return sendRes(res, 200, true, "Booking details fetched successfully", booking);
  } catch (error) {
    return sendRes(res, 500, false, "Something went wrong");
  }
};

export const cancelBookingByMerchant = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { reason } = req.body;

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
      message: reason ? `Booking cancelled by merchant: ${reason}` : "Booking cancelled by merchant",
      link: `/bookings/${booking._id}`,
    });

    return sendRes(res, 200, true, "Booking cancelled successfully", booking);
  } catch (error) {
    return sendRes(res, 500, false, "Something went wrong");
  }
};

export const cancelBookingByOwner = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { reason } = req.body;

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
    booking.endDate = new Date();
    await booking.save();

    await Shelf.updateMany(
      { _id: { $in: booking.shelves } },
      { $set: { status: "available", currentBooking: null } }
    );

    await Notification.create({
      recipient: booking.merchant,
      sender: req.user.id,
      message: reason ? `Booking cancelled by warehouse owner: ${reason}` : "Booking cancelled by warehouse owner",
      link: `/bookings/${booking._id}`,
    });

    return sendRes(res, 200, true, "Booking cancelled successfully", booking);
  } catch (error) {
    console.log(error.message)
    return sendRes(res, 500, false, "Something went wrong");
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
    return sendRes(res, 500, false, "Something went wrong");
  }
};
