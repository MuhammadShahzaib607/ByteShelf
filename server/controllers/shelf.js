import Shelf from "../models/Shelf.js";
import Warehouse from "../models/Warehouse.js";
import { sendRes } from "../utils/responseHandler.js";

export const addShelves = async (req, res) => {
  try {
    const { warehouseId } = req.params;
    const { numberOfShelves } = req.body;

    if (!numberOfShelves || numberOfShelves <= 0) {
      return sendRes(res, 400, false, "Number of shelves is required");
    }

    const warehouse = await Warehouse.findOne({ _id: warehouseId, owner: req.user.id });
    if (!warehouse) {
      return sendRes(res, 404, false, "Warehouse not found");
    }

    const shelves = [];
    for (let i = 1; i <= numberOfShelves; i++) {
      shelves.push({
        warehouse: warehouseId,
        shelfNumber: `${warehouse.name}-S${warehouse.shelfCounter + i}`,
        pricePerMonth: warehouse.pricePerShelf,
      });
    }

    await Shelf.insertMany(shelves);

    warehouse.totalShelves += numberOfShelves;
    warehouse.shelfCounter += numberOfShelves;
    await warehouse.save();

    return sendRes(res, 201, true, "Shelves added successfully", { totalShelves: warehouse.totalShelves });
  } catch (error) {
    return sendRes(res, 500, false, "Something went wrong");
  }
};

export const createShelf = async (req, res) => {
  try {
    const { warehouseId } = req.params;
    const { shelfNumber, pricePerMonth, dimensions, capacity, status } = req.body;

    if (!pricePerMonth || pricePerMonth <= 0) {
      return sendRes(res, 400, false, "Price per month is required");
    }

    const warehouse = await Warehouse.findOne({ _id: warehouseId, owner: req.user.id });
    if (!warehouse) {
      return sendRes(res, 404, false, "Warehouse not found");
    }

    const nextCounter = warehouse.shelfCounter + 1;
    const shelf = await Shelf.create({
      warehouse: warehouseId,
      shelfNumber: shelfNumber && shelfNumber.trim()
        ? shelfNumber.trim()
        : `${warehouse.name}-S${nextCounter}`,
      pricePerMonth,
      dimensions: dimensions && dimensions.trim() ? dimensions.trim() : "",
      capacity: capacity && capacity > 0 ? capacity : null,
      status: status && status === "maintenance" ? "maintenance" : "available",
    });

    warehouse.totalShelves += 1;
    warehouse.shelfCounter = nextCounter;
    await warehouse.save();

    return sendRes(res, 201, true, "Shelf created successfully", shelf);
  } catch (error) {
    console.log(error.message);
    return sendRes(res, 500, false, "Something went wrong");
  }
};

export const updateShelf = async (req, res) => {
  try {
    const { shelfId } = req.params;
    const { shelfNumber, pricePerMonth, dimensions, capacity, status } = req.body;

    const shelf = await Shelf.findById(shelfId);
    if (!shelf) {
      return sendRes(res, 404, false, "Shelf not found");
    }

    const warehouse = await Warehouse.findOne({ _id: shelf.warehouse, owner: req.user.id });
    if (!warehouse) {
      return sendRes(res, 401, false, "Unauthorized");
    }

    // Booked shelves cannot be edited into available/maintenance (booking integrity)
    if (shelf.status === "booked" && status && status !== "booked") {
      return sendRes(res, 400, false, "Booked shelves cannot change status until the booking ends");
    }

    if (shelfNumber !== undefined && shelfNumber.trim()) {
      shelf.shelfNumber = shelfNumber.trim();
    }
    if (pricePerMonth !== undefined && pricePerMonth > 0) {
      shelf.pricePerMonth = pricePerMonth;
    }
    if (dimensions !== undefined) {
      shelf.dimensions = dimensions.trim();
    }
    if (capacity !== undefined) {
      shelf.capacity = capacity && capacity > 0 ? capacity : null;
    }
    if (status !== undefined) {
      shelf.status = status;
    }

    await shelf.save();

    return sendRes(res, 200, true, "Shelf updated successfully", shelf);
  } catch (error) {
    console.log(error.message);
    return sendRes(res, 500, false, "Something went wrong");
  }
};

export const deleteShelf = async (req, res) => {
  try {
    const { shelfId } = req.params;

    const shelf = await Shelf.findById(shelfId);
    if (!shelf) {
      return sendRes(res, 404, false, "Shelf not found");
    }

    const warehouse = await Warehouse.findOne({ _id: shelf.warehouse, owner: req.user.id });
    if (!warehouse) {
      return sendRes(res, 401, false, "Unauthorized");
    }

    if (shelf.status === "booked") {
      return sendRes(res, 400, false, "Booked shelves cannot be deleted");
    }

    await Shelf.deleteOne({ _id: shelfId });
    await Warehouse.findByIdAndUpdate(warehouse._id, { $inc: { totalShelves: -1 } });

    return sendRes(res, 200, true, "Shelf deleted successfully");
  } catch (error) {
    console.log(error.message);
    return sendRes(res, 500, false, "Something went wrong");
  }
};

export const getWarehouseShelves = async (req, res) => {
  try {
    const { warehouseId } = req.params;

    const warehouse = await Warehouse.findOne({ _id: warehouseId, owner: req.user.id });
    if (!warehouse) {
      return sendRes(res, 404, false, "Warehouse not found");
    }

    const [shelves, availableCount, bookedCount] = await Promise.all([
      Shelf.find({ warehouse: warehouseId }).sort({ createdAt: -1 }),
      Shelf.countDocuments({ warehouse: warehouseId, status: "available" }),
      Shelf.countDocuments({ warehouse: warehouseId, status: "booked" }),
    ]);

    return sendRes(res, 200, true, "Shelves fetched successfully", {
      shelves,
      totalShelves: availableCount + bookedCount,
      available: availableCount,
      booked: bookedCount,
    });
  } catch (error) {
    return sendRes(res, 500, false, "Something went wrong");
  }
};

export const deleteShelves = async (req, res) => {
  try {
    const { shelfIds } = req.body;
    const warehouse = req.warehouse;

    if (!shelfIds || !Array.isArray(shelfIds) || shelfIds.length === 0) {
      return sendRes(res, 400, false, "Shelf id(s) are required");
    }

    const result = await Shelf.deleteMany({
      _id: { $in: shelfIds },
      warehouse: warehouse._id,
      status: "available",
    });

    if (result.deletedCount === 0) {
      return sendRes(res, 404, false, "No matching available shelves found to delete");
    }

    await Warehouse.findByIdAndUpdate(warehouse._id, { $inc: { totalShelves: -result.deletedCount } });

    return sendRes(res, 200, true, "Shelves deleted successfully", { deletedCount: result.deletedCount });
  } catch (error) {
    return sendRes(res, 500, false, "Something went wrong");
  }
};

export const getBookedShelvesByWarehouse = async (req, res) => {
  try {
    const { warehouseId } = req.params;

    const shelves = await Shelf.find({ warehouse: warehouseId, status: "booked" })
      .populate({
        path: "currentBooking",
        populate: {
          path: "merchant",
          select: "name email phone",
        },
      })
      .sort({ createdAt: -1 });

    return sendRes(res, 200, true, "Booked shelves fetched successfully", shelves);
  } catch (error) {
    return sendRes(res, 500, false, "Something went wrong");
  }
};

export const getAvailableShelves = async (req, res) => {
  try {
    const { warehouseId } = req.params;

    const shelves = await Shelf.find({ warehouse: warehouseId, status: "available" }).sort({ createdAt: 1 });

    return sendRes(res, 200, true, "Available shelves fetched successfully", shelves);
  } catch (error) {
    return sendRes(res, 500, false, "Something went wrong");
  }
};