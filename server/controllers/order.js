import Order from "../models/Order.js";
import InboundPlan from "../models/InboundPlan.js";
import Warehouse from "../models/Warehouse.js";
import User from "../models/User.js";
import Notification from "../models/Notification.js";
import { PDFParse } from "pdf-parse";
import { sendRes } from "../utils/responseHandler.js";

// ─── Helpers ────────────────────────────────────────────────────────────────────

// Normalized match key: prefer SKU when present, else item name (case-insensitive)
const itemKey = (item) => {
  const sku = (item.sku || "").toString().trim().toLowerCase();
  const name = (item.itemName || "").toString().trim().toLowerCase();
  return sku ? `sku:${sku}` : `name:${name}`;
};

// Stock matcher: an order line matches a stock line by SKU when the order line
// carries a SKU, otherwise falls back to a case-insensitive name match. This
// keeps PDF-parsed orders (which never carry SKUs) matchable against SKU'd
// carton inventory while preserving exact SKU matching when a SKU is present.
const matchesStock = (orderItem, stockItem) => {
  const oSku = (orderItem.sku || "").toString().trim().toLowerCase();
  const sSku = (stockItem.sku || "").toString().trim().toLowerCase();
  const oName = (orderItem.itemName || "").toString().trim().toLowerCase();
  const sName = (stockItem.itemName || "").toString().trim().toLowerCase();
  if (oSku) return oSku === sSku;
  return !!oName && oName === sName;
};

// Per-item available stock from a single inbound plan. Uses the plan's stock
// ledger (initialUnits / dispatchedUnits / availableUnits — the single source
// of truth for new plans) and falls back to deriving from the declared carton
// contents for legacy plans created before stock tracking existed.
const planStockEntries = (plan) => {
  if (Array.isArray(plan.stock) && plan.stock.length > 0) {
    return plan.stock.map((s) => ({
      itemName: s.itemName,
      sku: s.sku || "",
      quantity: s.availableUnits || 0,
    }));
  }
  const map = new Map();
  for (const carton of plan.cartons || []) {
    if (carton.status === "Dispatched") continue;
    for (const item of carton.items || []) {
      if (!item.itemName || item.quantity <= 0) continue;
      const key = itemKey(item);
      const entry = map.get(key) || {
        itemName: item.itemName,
        sku: item.sku || "",
        quantity: 0,
      };
      entry.quantity += item.quantity || 0;
      map.set(key, entry);
    }
  }
  return Array.from(map.values());
};

const buildPlanStock = (plan) => planStockEntries(plan);

const generateOrderId = () => {
  const ts = Date.now().toString(36).toUpperCase().slice(-5);
  const rand = Math.random().toString(36).toUpperCase().slice(2, 5);
  return `ORD-${ts}${rand}`;
};

// ─── Merchant stock (available storage inventory) ────────────────────────────────

export const getMerchantStock = async (req, res) => {
  try {
    const plans = await InboundPlan.find({ merchant: req.user.id }).populate(
      "warehouse",
      "name"
    );

    const byWarehouse = new Map();
    for (const plan of plans) {
      const wid = plan.warehouse?._id?.toString();
      if (!wid) continue;
      if (!byWarehouse.has(wid)) {
        byWarehouse.set(wid, {
          warehouseId: wid,
          warehouseName: plan.warehouse?.name || "Warehouse",
          items: new Map(),
        });
      }
      const store = byWarehouse.get(wid);
      for (const item of buildPlanStock(plan)) {
        const key = itemKey(item);
        const existing = store.items.get(key) || {
          itemName: item.itemName,
          sku: item.sku,
          quantity: 0,
        };
        existing.quantity += item.quantity;
        store.items.set(key, existing);
      }
    }

    const data = Array.from(byWarehouse.values()).map((w) => ({
      warehouseId: w.warehouseId,
      warehouseName: w.warehouseName,
      items: Array.from(w.items.values()),
    }));

    return sendRes(res, 200, true, "Stock fetched successfully", data);
  } catch (error) {
    console.error("[getMerchantStock] Error:", error.message);
    return sendRes(res, 500, false, "Something went wrong");
  }
};

// ─── Create order (manual or from AI PDF preview) ────────────────────────────────

export const createOrder = async (req, res) => {
  try {
    const { warehouseId, planId, customerDetails, orderedItems, source } = req.body;

    if (!warehouseId || !customerDetails) {
      return sendRes(res, 400, false, "Warehouse and customer details are required");
    }

    const { name, phone, address, city } = customerDetails || {};
    if (!name || !phone || !address || !city) {
      return sendRes(res, 400, false, "Customer name, phone, address and city are required");
    }

    if (!Array.isArray(orderedItems) || orderedItems.length === 0) {
      return sendRes(res, 400, false, "At least one ordered item is required");
    }

    const items = orderedItems.map((it) => ({
      itemName: String(it.itemName || "").trim(),
      sku: String(it.sku || "").trim(),
      quantity: Number(it.quantity) || 0,
    }));

    if (items.some((it) => !it.itemName || it.quantity < 1)) {
      return sendRes(res, 400, false, "Each item needs a name and a quantity of at least 1");
    }

    const warehouse = await Warehouse.findById(warehouseId);
    if (!warehouse) {
      return sendRes(res, 404, false, "Warehouse not found");
    }

    // Validate stock availability from this merchant's inbound inventory.
    // When a specific inbound plan is supplied, constrain validation to that
    // plan's remaining stock (contextual stock-linked creation).
    let sourcePlan = null;
    if (planId) {
      sourcePlan = await InboundPlan.findOne({
        _id: planId,
        merchant: req.user.id,
        warehouse: warehouseId,
      });
      if (!sourcePlan) {
        return sendRes(res, 404, false, "Inbound plan not found for this warehouse");
      }
    }

    const stockPlans = sourcePlan
      ? [sourcePlan]
      : await InboundPlan.find({
          merchant: req.user.id,
          warehouse: warehouseId,
        });

    // Total remaining units for a given order line across all in-scope plans
    const availableFor = (orderLine) => {
      let avail = 0;
      for (const plan of stockPlans) {
        for (const entry of planStockEntries(plan)) {
          if (!entry.itemName || entry.quantity <= 0) continue;
          if (matchesStock(orderLine, entry)) avail += entry.quantity;
        }
      }
      return avail;
    };

    for (const it of items) {
      const avail = availableFor(it);
      if (avail < it.quantity) {
        return sendRes(
          res,
          400,
          false,
          `Insufficient stock for "${it.itemName}" in ${warehouse.name} (available: ${avail}, required: ${it.quantity})`
        );
      }
    }

    // ─── Deduct stock at order creation ──────────────────────────────────
    // Deduct the dispatched quantity from the inbound inventory immediately,
    // so availableUnits always reflects reserved stock. When the order is
    // linked to a specific plan, decrement from that plan's stock only.
    // Legacy plans (created before stock tracking) get their ledger
    // materialized from the declared carton contents on first deduction.
    const remaining = items.map((it) => ({ match: it, qty: it.quantity }));
    for (const plan of stockPlans) {
      // Materialize the stock ledger for legacy plans
      if (!Array.isArray(plan.stock) || plan.stock.length === 0) {
        const map = new Map();
        for (const carton of plan.cartons || []) {
          if (carton.status === "Dispatched") continue;
          for (const item of carton.items || []) {
            if (!item.itemName || item.quantity <= 0) continue;
            const key = itemKey(item);
            const entry = map.get(key) || {
              itemName: item.itemName,
              sku: item.sku || "",
              initialUnits: 0,
              dispatchedUnits: 0,
              availableUnits: 0,
            };
            entry.initialUnits += item.quantity;
            entry.availableUnits += item.quantity;
            map.set(key, entry);
          }
        }
        plan.stock = Array.from(map.values());
      }

      let changed = false;
      for (const entry of plan.stock) {
        for (const r of remaining) {
          if (r.qty <= 0) continue;
          if (!matchesStock(r.match, entry)) continue;
          const take = Math.min(entry.availableUnits || 0, r.qty);
          if (take <= 0) continue;
          entry.availableUnits = (entry.availableUnits || 0) - take;
          entry.dispatchedUnits = (entry.dispatchedUnits || 0) + take;
          r.qty -= take;
          changed = true;
        }
      }
      if (changed) {
        plan.markModified("stock");
        await plan.save();
      }
    }

    const orderId = generateOrderId();

    const order = await Order.create({
      orderId,
      merchant: req.user.id,
      warehouse: warehouseId,
      inboundPlan: sourcePlan ? sourcePlan._id : null,
      customerDetails: { name, phone, address, city },
      orderedItems: items,
      source: source === "AI_PDF_Extraction" ? "AI_PDF_Extraction" : "Manual",
      timeline: [
        {
          status: "Pending Packing",
          timestamp: new Date(),
          note: "Order placed and stock reserved",
        },
      ],
    });

    // Notify the warehouse owner (targeted routing — never the creating merchant)
    const merchantUser = await User.findById(req.user.id).select("name");
    const merchantName = merchantUser?.name || "Merchant";
    const itemList = items
      .map((it) => `${it.quantity} units of ${it.itemName}`)
      .join(", ");
    await Notification.create({
      recipient: warehouse.owner,
      sender: req.user.id,
      title: "New Packing Request",
      message: `Merchant ${merchantName} placed an order for ${itemList} for your shelf in ${warehouse.name}. Please prepare for packing.`,
      link: "/dashboard",
    });

    return sendRes(res, 201, true, "Order created successfully", order);
  } catch (error) {
    console.error("[createOrder] Error:", error.message);
    return sendRes(res, 500, false, "Something went wrong");
  }
};

// ─── PDF text extraction (AI PDF import preview) ─────────────────────────────────

const findLabelValue = (lines, labels) => {
  for (let i = 0; i < lines.length; i++) {
    const lower = lines[i].toLowerCase();
    const hit = labels.find(
      (l) =>
        lower.startsWith(l) ||
        lower.includes(`${l}:`) ||
        lower.includes(`${l} `)
    );
    if (hit) {
      const idx = lower.indexOf(hit);
      const val = lines[i]
        .slice(idx + hit.length)
        .replace(/^[\s:.\-–—|]+/, "")
        .trim();
      if (val && val.length < 120) return val;
      if (i + 1 < lines.length) {
        const next = lines[i + 1].trim();
        if (next && next.length < 120) return next;
      }
    }
  }
  return "";
};

const parseItemsFromLines = (lines) => {
  const items = [];
  const seen = new Set();
  for (const line of lines) {
    if (line.length < 3 || line.length > 140) continue;
    if (/\b(invoice|order|total|subtotal|amount|qty|quantity|item|product|description|price|rate|tax|grand)\b/i.test(line)) {
      continue;
    }
    let itemName = "";
    let quantity = 0;

    // Pattern 1: "2 x Samsung Galaxy" / "3×Widget"
    let m = line.match(/^(\d{1,4})\s*[xX×*]\s*(.+)$/);
    if (m) {
      quantity = parseInt(m[1], 10);
      itemName = m[2].trim();
    }
    // Pattern 2: "Samsung Galaxy x2" / "Widget × 3"
    if (!itemName) {
      m = line.match(/^(.+?)\s*[xX×*]\s*(\d{1,4})$/);
      if (m && m[1].trim().length > 2) {
        itemName = m[1].trim();
        quantity = parseInt(m[2], 10);
      }
    }
    // Pattern 3: "2 Samsung Galaxy"
    if (!itemName) {
      m = line.match(/^(\d{1,4})\s+([A-Za-z][A-Za-z0-9 &.'\-]+)$/);
      if (m && m[2].trim().length > 2) {
        quantity = parseInt(m[1], 10);
        itemName = m[2].trim();
      }
    }

    // Remove trailing price like "Rs 1,200" / "$12.5" if the parser glued it on
    if (itemName) {
      itemName = itemName.replace(/\s+(rs\.?|pk[rs]+\.?|\$|€|£)?\s?\d[\d,]*\.?\d*$/i, "").trim();
      const key = itemName.toLowerCase();
      if (itemName && quantity > 0 && !seen.has(key)) {
        seen.add(key);
        items.push({ itemName, sku: "", quantity });
      }
    }
  }
  return items;
};

export const parsePdf = async (req, res) => {
  try {
    if (!req.file) {
      return sendRes(res, 400, false, "PDF file is required");
    }
    const isPdf =
      (req.file.mimetype || "").includes("pdf") ||
      (req.file.originalname || "").toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      return sendRes(res, 400, false, "Only PDF files are allowed");
    }

    const parser = new PDFParse({ data: req.file.buffer });
    const result = await parser.getText();
    const text = result.text || "";
    const lines = text
      .replace(/\r/g, "")
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);

    const customerDetails = {
      name:
        findLabelValue(lines, ["customer name", "bill to", "billing to", "invoice to", "ship to", "consignee"]) ||
        findLabelValue(lines, ["name"]),
      phone:
        findLabelValue(lines, ["phone", "mobile", "tel:", "contact"]) ||
        lines.find((l) => /^(?:\+?\d[\s-]?){9,15}$/.test(l)) ||
        "",
      address: findLabelValue(lines, ["delivery address", "shipping address", "billing address", "address"]),
      city: findLabelValue(lines, ["city"]),
    };

    const orderedItems = parseItemsFromLines(lines);

    if (orderedItems.length === 0) {
      return sendRes(
        res,
        422,
        false,
        "Could not detect any order line items in this PDF. Please use Manual Entry instead."
      );
    }

    return sendRes(res, 200, true, "PDF parsed successfully", {
      customerDetails,
      orderedItems,
      rawText: text.slice(0, 2000),
    });
  } catch (error) {
    console.error("[parsePdf] Error:", error.message);
    return sendRes(res, 500, false, "Failed to parse PDF. Please ensure the file is a valid text-based PDF.");
  }
};

// ─── Lists ───────────────────────────────────────────────────────────────────────

export const getMerchantOrders = async (req, res) => {
  try {
    const orders = await Order.find({ merchant: req.user.id })
      .populate("warehouse", "name location")
      .sort({ createdAt: -1 });
    return sendRes(res, 200, true, "Orders fetched successfully", orders);
  } catch (error) {
    return sendRes(res, 500, false, "Something went wrong");
  }
};

export const getWarehouseOrders = async (req, res) => {
  try {
    const warehouses = await Warehouse.find({ owner: req.user.id }).select("_id");
    const ids = warehouses.map((w) => w._id);
    const orders = await Order.find({ warehouse: { $in: ids } })
      .populate("warehouse", "name location")
      .populate("merchant", "name email")
      .sort({ createdAt: -1 });
    return sendRes(res, 200, true, "Orders fetched successfully", orders);
  } catch (error) {
    return sendRes(res, 500, false, "Something went wrong");
  }
};

// Orders for a specific warehouse (used by the Inbound Details drawer)
export const getOrdersByWarehouse = async (req, res) => {
  try {
    const { warehouseId } = req.params;
    const warehouse = await Warehouse.findById(warehouseId);
    if (!warehouse) {
      return sendRes(res, 404, false, "Warehouse not found");
    }

    const isOwner = warehouse.owner.toString() === req.user.id;
    const orders = await Order.find({ warehouse: warehouseId })
      .populate("merchant", "name")
      .sort({ createdAt: -1 });

    const visible = isOwner
      ? orders
      : orders.filter((o) => {
          const mid = o.merchant?._id?.toString?.() || o.merchant?.toString?.() || "";
          return mid === req.user.id;
        });

    return sendRes(res, 200, true, "Orders fetched successfully", visible);
  } catch (error) {
    return sendRes(res, 500, false, "Something went wrong");
  }
};

// ─── Fulfillment pipeline (warehouse owner) ──────────────────────────────────────

const assertOwnerOfOrder = async (order, req) => {
  const warehouse = await Warehouse.findById(order.warehouse);
  if (!warehouse || warehouse.owner.toString() !== req.user.id) {
    return { error: "Unauthorized to manage this order" };
  }
  return { warehouse };
};

export const markPacked = async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId);
    if (!order) {
      return sendRes(res, 404, false, "Order not found");
    }

    const auth = await assertOwnerOfOrder(order, req);
    if (auth.error) {
      return sendRes(res, 403, false, auth.error);
    }

    if (order.status !== "Pending Packing") {
      return sendRes(res, 400, false, "Order is not pending packing");
    }

    order.status = "Packed";
    order.timeline.push({
      status: "Packed",
      timestamp: new Date(),
      note: "Items packed by the warehouse",
    });
    await order.save();

    await Notification.create({
      recipient: order.merchant,
      sender: req.user.id,
      title: "Order Packed",
      message: `Order #${order.orderId} has been packed by the warehouse and is ready for dispatch`,
      link: "/merchant-dashboard",
    });

    return sendRes(res, 200, true, "Order marked as packed", order);
  } catch (error) {
    console.error("[markPacked] Error:", error.message);
    return sendRes(res, 500, false, "Something went wrong");
  }
};

export const dispatchOrder = async (req, res) => {
  try {
    const { courierName, trackingId, trackingUrl } = req.body;
    if (!trackingId || !trackingId.trim()) {
      return sendRes(res, 400, false, "Tracking ID is required");
    }
    if (!courierName || !courierName.trim()) {
      return sendRes(res, 400, false, "Courier name is required");
    }

    const order = await Order.findById(req.params.orderId);
    if (!order) {
      return sendRes(res, 404, false, "Order not found");
    }

    const auth = await assertOwnerOfOrder(order, req);
    if (auth.error) {
      return sendRes(res, 403, false, auth.error);
    }

    if (order.status !== "Packed") {
      return sendRes(res, 400, false, "Order must be packed before dispatch");
    }

    // Stock was already deducted from the inbound inventory when the order
    // was created — dispatch only advances the status and records the
    // courier / tracking details.
    const cleanCourier = courierName.trim();
    const cleanTracking = trackingId.trim();
    order.status = "Dispatched";
    order.trackingId = cleanTracking;
    order.dispatchTimestamp = new Date();
    order.courierDetails = {
      courierName: cleanCourier,
      trackingId: cleanTracking,
      trackingUrl: (trackingUrl || "").trim(),
    };
    order.timeline.push({
      status: "Dispatched",
      timestamp: new Date(),
      note: `Handed over to ${cleanCourier} — ${cleanTracking}`,
    });
    await order.save();

    await Notification.create({
      recipient: order.merchant,
      sender: req.user.id,
      title: "Order Dispatched",
      message: `Order #${order.orderId} has been dispatched via ${cleanCourier} (Tracking: ${cleanTracking}).`,
      link: "/merchant-dashboard",
    });

    return sendRes(res, 200, true, "Order dispatched successfully", order);
  } catch (error) {
    console.error("[dispatchOrder] Error:", error.message);
    return sendRes(res, 500, false, "Something went wrong");
  }
};

export const markDelivered = async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId);
    if (!order) {
      return sendRes(res, 404, false, "Order not found");
    }

    const auth = await assertOwnerOfOrder(order, req);
    if (auth.error) {
      return sendRes(res, 403, false, auth.error);
    }

    if (order.status !== "Dispatched" && order.status !== "In Transit") {
      return sendRes(res, 400, false, "Order must be dispatched before marking delivered");
    }

    order.status = "Delivered";
    order.timeline.push({
      status: "Delivered",
      timestamp: new Date(),
      note: `Delivered to ${order.customerDetails?.name || "customer"}`,
    });
    await order.save();

    await Notification.create({
      recipient: order.merchant,
      sender: req.user.id,
      title: "Order Delivered",
      message: `Order #${order.orderId} delivered successfully to ${order.customerDetails?.name || "customer"}.`,
      link: "/merchant-dashboard",
    });

    return sendRes(res, 200, true, "Order marked as delivered", order);
  } catch (error) {
    console.error("[markDelivered] Error:", error.message);
    return sendRes(res, 500, false, "Something went wrong");
  }
};
