import mongoose from "mongoose";
import Warehouse from "../models/Warehouse.js";
import { sendRes } from "../utils/responseHandler.js";
import Shelf from "../models/Shelf.js";

export const createWarehouse = async (req, res) => {
  try {
    const { name, location, latitude, longitude, pricePerShelf, images } = req.body;
 
    if (!name || !location || !latitude || !longitude || !pricePerShelf) {
      return sendRes(res, 400, false, "All fields are required");
    }
 
    const trimmedName = name.trim();
    const trimmedLocation = location.trim();
 
    const existingWarehouse = await Warehouse.findOne({ name: trimmedName });
    if (existingWarehouse) {
      return sendRes(res, 409, false, "Warehouse name already exists");
    }
 
    const warehouse = await Warehouse.create({
      name: trimmedName,
      location: trimmedLocation,
      latitude,
      longitude,
      pricePerShelf,
      images,
      owner: req.user.id,
    });
 
    return sendRes(res, 201, true, "Warehouse created successfully", { warehouseId: warehouse._id });
  } catch (error) {
    return sendRes(res, 500, false, "Something went wrong");
  }
};

export const getMyWarehouses = async (req, res) => {
  try {
    const ownerId = req.user.id;
 
    const result = await Warehouse.aggregate([
      { $match: { owner: new mongoose.Types.ObjectId(ownerId) } },
      {
        $facet: {
          warehouses: [{ $sort: { createdAt: -1 } }],
          meta: [
            {
              $group: {
                _id: null,
                totalWarehouses: { $sum: 1 },
                totalShelves: { $sum: "$totalShelves" },
              },
            },
          ],
        },
      },
    ]);
 
    const warehouses = result[0].warehouses;
    const meta = result[0].meta[0] || { totalWarehouses: 0, totalShelves: 0 };
 
    return sendRes(res, 200, true, "Warehouses fetched successfully", {
      warehouses,
      totalWarehouses: meta.totalWarehouses,
      totalShelves: meta.totalShelves,
    });
  } catch (error) {
    console.log(error.message);
    return sendRes(res, 500, false, "Something went wrong");
  }
};

export const editWarehouse = async (req, res) => {
  try {
    const { warehouseId } = req.params;
    const { location, latitude, longitude, pricePerShelf } = req.body;
 
    if (!location && !latitude && !longitude && !pricePerShelf) {
      return sendRes(res, 400, false, "At least one field is required to update");
    }
 
    const warehouse = await Warehouse.findOne({ _id: warehouseId, owner: req.user.id });
    if (!warehouse) {
      return sendRes(res, 404, false, "Warehouse not found");
    }
 
    if (location) warehouse.location = location.trim();
    if (latitude) warehouse.latitude = latitude;
    if (longitude) warehouse.longitude = longitude;
    if (pricePerShelf) warehouse.pricePerShelf = pricePerShelf;
 
    await warehouse.save();
 
    return sendRes(res, 200, true, "Warehouse updated successfully", warehouse);
  } catch (error) {
    return sendRes(res, 500, false, "Something went wrong");
  }
};

export const getAllWarehouses = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const [warehouses, total] = await Promise.all([
      Warehouse.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
      Warehouse.countDocuments(),
    ]);

    return sendRes(res, 200, true, "Warehouses fetched successfully", {
      warehouses,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalWarehouses: total,
    });
  } catch (error) {
    return sendRes(res, 500, false, "Something went wrong");
  }
};

export const getWarehouseById = async (req, res) => {
  try {
    const { warehouseId } = req.params;

    const [warehouse, availableCount, bookedCount] = await Promise.all([
      Warehouse.findById(warehouseId).select("-shelfCounter"),
      Shelf.countDocuments({ warehouse: warehouseId, status: "available" }),
      Shelf.countDocuments({ warehouse: warehouseId, status: "booked" }),
    ]);

    if (!warehouse) {
      return sendRes(res, 404, false, "Warehouse not found");
    }

    return sendRes(res, 200, true, "Warehouse fetched successfully", {
      warehouse,
      available: availableCount,
      booked: bookedCount,
    });
  } catch (error) {
    return sendRes(res, 500, false, "Something went wrong");
  }
};