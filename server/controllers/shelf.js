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