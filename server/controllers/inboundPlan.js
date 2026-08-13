import mongoose from "mongoose";
import InboundPlan from "../models/InboundPlan.js";
import Carton from "../models/Carton.js";
import Booking from "../models/Booking.js";
import Notification from "../models/Notification.js";
import Warehouse from "../models/Warehouse.js";

import { sendRes } from "../utils/responseHandler.js";

// Auto-generate a short SKU when the merchant leaves the SKU blank
const generateSku = (itemName) => {
  const base =
    String(itemName || "ITEM")
      .trim()
      .replace(/[^a-zA-Z0-9]/g, "")
      .toUpperCase()
      .slice(0, 4) || "ITEM";
  return `${base}-${Date.now().toString(36).toUpperCase().slice(-4)}${Math.random()
    .toString(36)
    .toUpperCase()
    .slice(2, 5)}`;
};

export const createInboundPlan = async (req, res) => {
  try {
    const { bookingId, batchName, expectedDate, items, totalCartons, cartons: cartonsData } = req.body;

    if (!bookingId || !batchName || !expectedDate) {
      return sendRes(res, 400, false, "All fields are required");
    }

    const booking = await Booking.findOne({ _id: bookingId, merchant: req.user.id });
    if (!booking) {
      return sendRes(res, 404, false, "Booking not found");
    }

    // Payment guard: inbound creation is locked until the booking is PAID
    if (booking.paymentStatus !== "paid") {
      return sendRes(res, 400, false, "Payment pending — inbound creation unlocks after booking payment is confirmed.");
    }

    if (booking.status !== "confirmed") {
      return sendRes(res, 400, false, "Booking is not active");
    }

    if (new Date(booking.endDate) < new Date()) {
      return sendRes(res, 400, false, "Booking has expired");
    }

    // ─── Item-detail payload (new flow): items = [{ itemName, sku, totalCartons, itemsPerCarton }] ───
    const itemPayload = Array.isArray(items) ? items.filter((it) => it && it.itemName) : [];

    let cartonContents = [];
    let stock = [];
    let planTotalCartons = 0;

    if (itemPayload.length > 0) {
      // Validate + normalize each declared item
      const normalized = itemPayload.map((it) => {
        const itemName = String(it.itemName || "").trim();
        const cartons = Number(it.totalCartons) || 0;
        const perCarton = Number(it.itemsPerCarton) || 0;
        if (!itemName || cartons < 1 || perCarton < 1) {
          return null;
        }
        return {
          itemName,
          sku: String(it.sku || "").trim(),
          cartons,
          perCarton,
        };
      }).filter(Boolean);

      if (normalized.length === 0) {
        return sendRes(res, 400, false, "Each item needs a name, at least 1 carton and at least 1 piece per carton");
      }

      // Build carton declarations + stock ledger from the item details
      let cartonIndex = 0;
      for (const it of normalized) {
        const sku = it.sku || generateSku(it.itemName);
        const initialUnits = it.cartons * it.perCarton;
        planTotalCartons += it.cartons;
        stock.push({
          itemName: it.itemName,
          sku,
          initialUnits,
          dispatchedUnits: 0,
          availableUnits: initialUnits,
        });
        for (let c = 0; c < it.cartons; c++) {
          cartonIndex += 1;
          cartonContents.push({
            cartonNumber: `CTN-${String(cartonIndex).padStart(3, "0")}`,
            items: [{ itemName: it.itemName, sku, quantity: it.perCarton }],
            status: "In Storage",
            totalItemsCount: it.perCarton,
          });
        }
      }

      if (planTotalCartons <= 0) {
        return sendRes(res, 400, false, "Total cartons must be greater than 0");
      }
    } else {
      // ─── Legacy payload: totalCartons + optional per-carton contents ────
      if (!totalCartons || Number(totalCartons) <= 0) {
        return sendRes(res, 400, false, "Total cartons must be greater than 0");
      }
      planTotalCartons = Number(totalCartons);

      cartonContents = Array.isArray(cartonsData)
        ? cartonsData
            .map((c, idx) => {
              const items = Array.isArray(c.items)
                ? c.items
                    .filter((i) => i.itemName && Number(i.quantity) > 0)
                    .map((i) => ({
                      itemName: String(i.itemName).trim(),
                      sku: String(i.sku || "").trim(),
                      quantity: Number(i.quantity) || 0,
                    }))
                : [];
              if (items.length === 0) return null;
              return {
                cartonNumber:
                  String(c.cartonNumber || "").trim() ||
                  `CTN-${String(idx + 1).padStart(3, "0")}`,
                items,
                status: "In Storage",
                totalItemsCount: items.reduce((s, i) => s + i.quantity, 0),
              };
            })
            .filter(Boolean)
        : [];

      // Derive the stock ledger from the declared carton contents
      const stockMap = new Map();
      for (const c of cartonContents) {
        for (const i of c.items || []) {
          const key = (i.sku || "").toLowerCase() || i.itemName.toLowerCase();
          const entry = stockMap.get(key) || {
            itemName: i.itemName,
            sku: i.sku || generateSku(i.itemName),
            initialUnits: 0,
            dispatchedUnits: 0,
            availableUnits: 0,
          };
          entry.initialUnits += i.quantity;
          entry.availableUnits += i.quantity;
          stockMap.set(key, entry);
        }
      }
      stock = Array.from(stockMap.values());
    }

    const inboundPlan = await InboundPlan.create({
      merchant: req.user.id,
      warehouse: booking.warehouse,
      booking: booking._id,
      batchName: batchName.trim(),
      totalCartons: planTotalCartons,
      expectedDate,
      cartons: cartonContents,
      stock,
    });

    const cartons = [];
    for (let i = 1; i <= planTotalCartons; i++) {
      cartons.push({
        inboundPlan: inboundPlan._id,
        warehouse: booking.warehouse,
        cartonCode: `${inboundPlan._id}-C${i}`,
      });
    }

    await Carton.insertMany(cartons);

    const warehouse = await Warehouse.findById(booking.warehouse);

    // Notify the warehouse owner (targeted routing — never the creating merchant)
    await Notification.create({
      recipient: warehouse.owner,
      sender: req.user.id,
      title: "New Inbound Shipment",
      message: `New inbound added for your warehouse booking: ${planTotalCartons} carton(s) in batch "${batchName}"`,
      link: `/inbound-plans/${inboundPlan._id}`,
    });

    return sendRes(res, 201, true, "Inbound plan created successfully", inboundPlan);
  } catch (error) {
    console.log(error.message)
    return sendRes(res, 500, false, error.message || String(error), null, error);
  }
};

export const getMyInboundPlans = async (req, res) => {
  try {
    const { bookingId } = req.query;

    const matchQuery = {
      merchant: new mongoose.Types.ObjectId(req.user.id),
    };

    if (bookingId) {
      matchQuery.booking = new mongoose.Types.ObjectId(bookingId);
    }

    const plans = await InboundPlan.aggregate([
      { $match: matchQuery },
      { $sort: { createdAt: -1 } },
      {
        $lookup: {
          from: "cartons",
          let: { planId: "$_id" },
          pipeline: [
            { $match: { $expr: { $eq: ["$inboundPlan", "$$planId"] } } },
            { $group: { _id: "$status", count: { $sum: 1 } } },
          ],
          as: "cartonStats",
        },
      },
    ]);

    return sendRes(res, 200, true, "Inbound plans fetched successfully", plans);
  } catch (error) {
    console.error("[inboundPlan] Error:", error);
    return sendRes(res, 500, false, error.message || String(error), null, error);
  }
};

export const getInboundPlanDetails = async (req, res) => {
  try {
    const { inboundPlanId } = req.params;

    const plan = await InboundPlan.findById(inboundPlanId).populate("warehouse");
    if (!plan) {
      return sendRes(res, 404, false, "Inbound plan not found");
    }

    // Allow if user is the merchant who created the plan OR the warehouse owner
    const isMerchant = plan.merchant.toString() === req.user.id;
    const isOwner = plan.warehouse && plan.warehouse.owner.toString() === req.user.id;

    if (!isMerchant && !isOwner) {
      return sendRes(res, 403, false, "Unauthorized to view this inbound plan");
    }

    const cartons = await Carton.find({ inboundPlan: inboundPlanId }).sort({ createdAt: 1 });

    return sendRes(res, 200, true, "Inbound plan details fetched successfully", { plan, cartons });
  } catch (error) {
    console.error("[inboundPlan] Error:", error);
    return sendRes(res, 500, false, error.message || String(error), null, error);
  }
};

export const getWarehouseInboundPlans = async (req, res) => {
  try {
    const plans = await InboundPlan.find({ warehouse: req.warehouse._id }).sort({ createdAt: -1 });

    return sendRes(res, 200, true, "Inbound plans fetched successfully", plans);
  } catch (error) {
    console.error("[inboundPlan] Error:", error);
    return sendRes(res, 500, false, error.message || String(error), null, error);
  }
};

// ─── Warehouse Owner inbound management (spec: /api/v1/owner/*) ──────────────

// Shared aggregation for warehouse-owner inbound plans. When `warehouseId` is
// provided the list is scoped to that warehouse; otherwise it spans every
// warehouse owned by the user. Enriches each plan with warehouse/merchant names,
// declared carton contents and carton status counts (cartonStats).
const fetchOwnerPlans = async (ownerId, warehouseId) => {
  const ownerWarehouses = await Warehouse.find({ owner: ownerId }).select("_id");
  if (ownerWarehouses.length === 0) return [];

  const ownedWarehouseIds = ownerWarehouses.map((w) => w._id);

  const matchQuery = {};
  if (warehouseId) {
    const isValid = ownedWarehouseIds.some((id) => id.toString() === String(warehouseId));
    if (!isValid) {
      const err = new Error("Unauthorized to view this warehouse's inbound plans");
      err.status = 403;
      throw err;
    }
    matchQuery.warehouse = new mongoose.Types.ObjectId(warehouseId);
  } else {
    matchQuery.warehouse = { $in: ownedWarehouseIds };
  }

  return InboundPlan.aggregate([
    { $match: matchQuery },
    { $sort: { createdAt: -1 } },
    {
      $lookup: {
        from: "warehouses",
        localField: "warehouse",
        foreignField: "_id",
        as: "warehouseInfo",
      },
    },
    { $unwind: { path: "$warehouseInfo", preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: "users",
        localField: "merchant",
        foreignField: "_id",
        as: "merchantInfo",
      },
    },
    { $unwind: { path: "$merchantInfo", preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: "cartons",
        let: { planId: "$_id" },
        pipeline: [
          { $match: { $expr: { $eq: ["$inboundPlan", "$$planId"] } } },
          { $group: { _id: "$status", count: { $sum: 1 } } },
        ],
        as: "cartonStats",
      },
    },
    {
      $project: {
        _id: 1,
        merchant: 1,
        warehouse: 1,
        booking: 1,
        batchName: 1,
        totalCartons: 1,
        receivedCount: 1,
        expectedDate: 1,
        status: 1,
        createdAt: 1,
        stock: 1,
        cartons: 1,
        cartonStats: 1,
        merchantName: { $ifNull: ["$merchantInfo.name", null] },
        warehouseName: { $ifNull: ["$warehouseInfo.name", null] },
        warehouseLocation: { $ifNull: ["$warehouseInfo.location", null] },
      },
    },
  ]);
};

// GET /api/v1/inbound/owner?warehouseId= — all inbound plans across the owner's
// warehouses (optional single-warehouse filter).
export const getOwnerInboundPlans = async (req, res) => {
  try {
    const plans = await fetchOwnerPlans(req.user.id, req.query.warehouseId);
    return sendRes(res, 200, true, "Inbound plans fetched successfully", plans);
  } catch (error) {
    const status = error.status === 403 ? 403 : 500;
    console.error("[inboundPlan] Error:", error);
    return sendRes(res, status, false, error.message || String(error), null, error);
  }
};

// GET /api/v1/owner/warehouses/:warehouseId/inbounds — plans + cartons for one
// owned warehouse (spec: owner warehouse inbound list).
export const getOwnerWarehouseInbounds = async (req, res) => {
  try {
    const { warehouseId } = req.params;

    const warehouse = await Warehouse.findOne({ _id: warehouseId, owner: req.user.id });
    if (!warehouse) {
      return sendRes(res, 404, false, "Warehouse not found or not owned by you");
    }

    const plans = await fetchOwnerPlans(req.user.id, warehouseId);

    return sendRes(res, 200, true, "Inbound plans fetched successfully", {
      warehouse: {
        _id: warehouse._id,
        name: warehouse.name,
        location: warehouse.location,
        totalShelves: warehouse.totalShelves,
      },
      plans,
    });
  } catch (error) {
    const status = error.status === 403 ? 403 : 500;
    console.error("[inboundPlan] Error:", error);
    return sendRes(res, status, false, error.message || String(error), null, error);
  }
};

// PATCH /api/v1/owner/inbounds/:inboundId/status — mark a shipment as ARRIVED.
// Owner-only (verified against the inbound's warehouse), flips all associated
// in-transit cartons to arrived and notifies the merchant (arrival unlocks
// order creation from this stock).
export const updateInboundStatus = async (req, res) => {
  try {
    const { inboundId } = req.params;
    const targetStatus = String(req.body?.status || "").toLowerCase();

    // This endpoint intentionally only supports the ARRIVED transition.
    if (targetStatus !== "arrived") {
      return sendRes(res, 400, false, "Only status 'ARRIVED' is supported on this endpoint");
    }

    const plan = await InboundPlan.findById(inboundId);
    if (!plan) {
      return sendRes(res, 404, false, "Inbound plan not found");
    }

    const warehouse = await Warehouse.findById(plan.warehouse);
    if (!warehouse || warehouse.owner.toString() !== req.user.id) {
      return sendRes(res, 403, false, "Unauthorized to manage this inbound plan");
    }

    // Idempotent — already arrived is a success, not an error.
    if (plan.status === "arrived") {
      return sendRes(res, 200, true, "Inbound shipment is already marked as arrived", plan);
    }

    // Lifecycle guards — cancelled/completed shipments can't be (re)opened.
    if (plan.status === "cancelled") {
      return sendRes(res, 400, false, "Cannot mark a cancelled shipment as arrived");
    }
    if (plan.status === "completed") {
      return sendRes(res, 400, false, "Shipment is already completed");
    }

    plan.status = "arrived";
    plan.receivedCount = plan.totalCartons;
    await plan.save();

    // Flip every in-transit carton for this shipment to arrived.
    await Carton.updateMany(
      { inboundPlan: plan._id, status: "in-transit" },
      { $set: { status: "arrived" } }
    );

    // Notify the merchant — arrival unlocks order creation from this stock.
    await Notification.create({
      recipient: plan.merchant,
      sender: req.user.id,
      title: "Shipment Arrived",
      message: `Your inbound shipment "${plan.batchName}" has arrived at the warehouse. You can now create orders from this stock.`,
      link: "/merchant-dashboard",
    });

    return sendRes(res, 200, true, "Inbound shipment marked as arrived", plan);
  } catch (error) {
    console.error("[inboundPlan] Error:", error);
    return sendRes(res, 500, false, error.message || String(error), null, error);
  }
};