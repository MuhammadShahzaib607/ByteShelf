import Warehouse from "../../models/Warehouse.js";
import { sendRes } from "../responseHandler.js";

export const verifyWarehouseOwner = async (req, res, next) => {
  try {
    const warehouseId = req.params.warehouseId || req.body.warehouseId;

    if (!warehouseId) {
      return sendRes(res, 400, false, "Warehouse id is required");
    }

    const warehouse = await Warehouse.findById(warehouseId);
    if (!warehouse) {
      return sendRes(res, 404, false, "Warehouse not found");
    }

    if (warehouse.owner.toString() !== req.user.id) {
      return sendRes(res, 401, false, "Unauthorized");
    }

    req.warehouse = warehouse;
    next();
  } catch (error) {
    return sendRes(res, 500, false, "Something went wrong");
  }
};