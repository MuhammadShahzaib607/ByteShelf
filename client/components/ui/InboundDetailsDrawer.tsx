"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Package,
  Box,
  ChevronDown,
  ClipboardList,
  Truck,
  MapPin,
  CalendarDays,
  Loader2,
  Layers,
  Hash,
} from "lucide-react";
import api from "@/lib/axios";
import CreateOrderModal from "./CreateOrderModal";

// ─── Types ──────────────────────────────────────────────────────────────────────

interface CartonContent {
  cartonNumber: string;
  items: Array<{ itemName: string; sku?: string; quantity: number }>;
  status: "In Storage" | "Unpacked" | "Dispatched";
  totalItemsCount: number;
}

interface PhysicalCarton {
  _id: string;
  cartonCode: string;
  status: "in-transit" | "arrived" | "stored";
  shelf?: string | null;
}

interface StockEntry {
  itemName: string;
  sku?: string;
  initialUnits: number;
  dispatchedUnits: number;
  availableUnits: number;
}

interface PlanDetail {
  plan: {
    _id: string;
    batchName: string;
    totalCartons: number;
    expectedDate: string;
    status: string;
    cartons?: CartonContent[];
    stock?: StockEntry[];
    warehouse?: { _id: string; name: string; location?: string };
  };
  cartons: PhysicalCarton[];
}

interface OrderItem {
  itemName: string;
  sku?: string;
  quantity: number;
}

interface AssociatedOrder {
  _id: string;
  orderId: string;
  inboundPlan?: string | null;
  customerDetails: { name: string; phone?: string; city: string };
  orderedItems: OrderItem[];
  status: string;
  createdAt: string;
}

// Normalized match key: prefer SKU when present, else item name (lowercase)
const itemKey = (item: { itemName: string; sku?: string }) => {
  const sku = (item.sku || "").trim().toLowerCase();
  const name = (item.itemName || "").trim().toLowerCase();
  return sku ? `sku:${sku}` : `name:${name}`;
};

// ─── Helpers ────────────────────────────────────────────────────────────────────

function formatDate(d: string): string {
  return new Date(d).toLocaleDateString("en-PK", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(d: string): string {
  return new Date(d).toLocaleString("en-PK", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function contentStatusBadge(status: string) {
  const map: Record<string, string> = {
    "In Storage": "bg-[#84cc16]/10 border-[#84cc16]/30 text-[#84cc16]",
    Unpacked: "bg-amber-500/10 border-amber-500/30 text-amber-400",
    Dispatched: "bg-sky-500/10 border-sky-500/30 text-sky-400",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider border ${
        map[status] || "bg-neutral-500/10 border-neutral-500/30 text-neutral-400"
      }`}
    >
      {status === "Dispatched" ? <Truck size={10} /> : <Box size={10} />}
      {status}
    </span>
  );
}

function orderStatusBadge(status: string) {
  const map: Record<string, string> = {
    "Pending Packing": "bg-amber-500/10 border-amber-500/30 text-amber-400",
    Packed: "bg-sky-500/10 border-sky-500/30 text-sky-400",
    Dispatched: "bg-[#84cc16]/10 border-[#84cc16]/30 text-[#84cc16]",
    Delivered: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400",
    Cancelled: "bg-red-500/10 border-red-500/30 text-red-400",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider border ${
        map[status] || "bg-neutral-500/10 border-neutral-500/30 text-neutral-400"
      }`}
    >
      {status === "Dispatched" ? <Truck size={10} /> : <ClipboardList size={10} />}
      {status}
    </span>
  );
}

// ─── Component ──────────────────────────────────────────────────────────────────

export default function InboundDetailsDrawer({
  plan,
  onClose,
}: {
  plan: {
    _id: string;
    batchName: string;
    totalCartons: number;
    expectedDate: string;
    status: string;
    stock?: StockEntry[];
    warehouse?: { _id: string; name: string };
  };
  onClose: () => void;
}) {
  const [detail, setDetail] = useState<PlanDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<AssociatedOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [tab, setTab] = useState<"cartons" | "orders">("cartons");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [warehouseId, setWarehouseId] = useState<string>(
    typeof plan.warehouse === "string"
      ? plan.warehouse
      : plan.warehouse?._id || ""
  );
  const [showOrderModal, setShowOrderModal] = useState(false);

  // ─── Fetch plan detail + associated orders ─────────────────────────────
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get(`/inbound/${plan._id}`);
        if (!cancelled) {
          setDetail(res.data.data);
          // The list API returns warehouse as an id string; the detail API
          // populates it — prefer the populated object for the orders tab.
          const wh = res.data.data?.plan?.warehouse;
          if (wh) {
            setWarehouseId(wh._id || (typeof wh === "string" ? wh : ""));
          }
        }
      } catch {
        /* ignore */
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [plan._id]);

  const fetchOrders = useCallback(async () => {
    if (!warehouseId) return;
    setOrdersLoading(true);
    try {
      const res = await api.get(`/order/warehouse/${warehouseId}`);
      setOrders(Array.isArray(res.data.data) ? res.data.data : []);
    } catch {
      /* ignore */
    } finally {
      setOrdersLoading(false);
    }
  }, [warehouseId]);

  const handleTabChange = (next: "cartons" | "orders") => {
    setTab(next);
    if (next === "orders" && orders.length === 0) fetchOrders();
  };

  const toggleExpanded = (key: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const declaredCartons = detail?.plan?.cartons?.filter((c) => c.items?.length) || [];
  const physicalCartons = detail?.cartons || [];
  const p = detail?.plan || plan;

  // Only orders linked to this inbound plan belong in its "Associated Orders"
  // tab — orders created from other inbounds at the same warehouse are excluded.
  const associatedOrders = orders.filter((o) => {
    const pid = o.inboundPlan;
    return typeof pid === "string" ? pid === p._id : false;
  });

  // Per-item stock ledger — prefers the plan's stock array (single source of
  // truth) and falls back to deriving from declared cartons for legacy plans.
  const stockRecord: StockEntry[] = (() => {
    const planStock = p.stock;
    if (Array.isArray(planStock) && planStock.length > 0) return planStock;
    const map = new Map<
      string,
      { itemName: string; sku: string; initialUnits: number; dispatchedUnits: number; availableUnits: number }
    >();
    for (const carton of declaredCartons) {
      if (carton.status === "Dispatched") continue;
      for (const item of carton.items || []) {
        if (!item.itemName || item.quantity <= 0) continue;
        const key = itemKey(item);
        const cur = map.get(key) || {
          itemName: item.itemName,
          sku: item.sku || "",
          initialUnits: 0,
          dispatchedUnits: 0,
          availableUnits: 0,
        };
        cur.initialUnits += item.quantity || 0;
        cur.availableUnits += item.quantity || 0;
        map.set(key, cur);
      }
    }
    return Array.from(map.values());
  })();

  // Aggregate remaining stock for dispatch order creation
  const availableStock = stockRecord
    .filter((s) => (s.availableUnits || 0) > 0)
    .map((s) => ({
      itemName: s.itemName,
      sku: s.sku || "",
      quantity: s.availableUnits || 0,
    }));

  const cartonContentKeys = new Set(declaredCartons.map((c) => c.cartonNumber));
  const fallbackCartons = physicalCartons.filter(
    (c) => !cartonContentKeys.has(c.cartonCode)
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="w-full max-w-xl bg-[#111614]/95 backdrop-blur-md shadow-2xl overflow-y-auto border-l border-neutral-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ─── Header ─── */}
        <div className="sticky top-0 z-20 bg-[#111614]/90 backdrop-blur-md border-b border-neutral-800 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-[#84cc16]/10 border border-[#84cc16]/30 flex items-center justify-center shrink-0">
              <Package size={19} className="text-[#84cc16]" />
            </div>
            <div className="min-w-0">
              <h2 className="font-heading text-lg font-semibold text-white truncate">
                {p.batchName || "Inbound Plan"}
              </h2>
              <p className="text-xs text-neutral-400 font-body">
                Inbound Details · {plan.totalCartons} carton{plan.totalCartons !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-neutral-400 hover:text-white hover:bg-white/20 transition-all shrink-0"
          >
            <X size={16} />
          </button>
        </div>

        {loading ? (
          <div className="p-8 space-y-4 animate-pulse">
            <div className="h-10 bg-neutral-800/60 rounded-2xl" />
            <div className="h-24 bg-neutral-800/60 rounded-2xl" />
            <div className="h-24 bg-neutral-800/60 rounded-2xl" />
          </div>
        ) : (
          <div className="p-6">
            {/* ─── Meta row ─── */}
            <div className="grid grid-cols-3 gap-3 mb-5">
              <div className="p-3 rounded-xl bg-neutral-900/80 border border-neutral-800">
                <div className="flex items-center gap-1.5 mb-1">
                  <Hash size={11} className="text-[#84cc16]/70" />
                  <p className="text-[9px] font-semibold tracking-wider text-neutral-500 uppercase font-body">
                    Cartons
                  </p>
                </div>
                <p className="text-sm font-bold text-white font-body numeric">{plan.totalCartons}</p>
              </div>
              <div className="p-3 rounded-xl bg-neutral-900/80 border border-neutral-800">
                <div className="flex items-center gap-1.5 mb-1">
                  <CalendarDays size={11} className="text-[#84cc16]/70" />
                  <p className="text-[9px] font-semibold tracking-wider text-neutral-500 uppercase font-body">
                    Expected
                  </p>
                </div>
                <p className="text-sm font-bold text-white font-body">{formatDate(plan.expectedDate)}</p>
              </div>
              <div className="p-3 rounded-xl bg-neutral-900/80 border border-neutral-800">
                <div className="flex items-center gap-1.5 mb-1">
                  <MapPin size={11} className="text-[#84cc16]/70" />
                  <p className="text-[9px] font-semibold tracking-wider text-neutral-500 uppercase font-body">
                    Status
                  </p>
                </div>
                <p className="text-sm font-bold text-white font-body capitalize">
                  {String(plan.status || "in-transit").replace("-", " ")}
                </p>
              </div>
            </div>

            {/* ─── Stock Record ─── */}
            {stockRecord.length > 0 && (
              <div className="mb-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[10px] font-semibold tracking-wider text-neutral-500 uppercase font-body">
                    Stock Record
                  </p>
                  <span className="text-[10px] text-neutral-500 font-body">
                    {plan.totalCartons} carton{plan.totalCartons !== 1 ? "s" : ""}
                  </span>
                </div>
                <div className="space-y-3">
                  {stockRecord.map((s) => {
                    const pct =
                      s.initialUnits > 0
                        ? Math.round(((s.availableUnits || 0) / s.initialUnits) * 100)
                        : 0;
                    return (
                      <div
                        key={itemKey(s)}
                        className="p-4 rounded-2xl bg-neutral-900/60 border border-neutral-800"
                      >
                        <div className="flex items-center justify-between gap-3 mb-2">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-white font-body truncate">
                              {s.itemName}
                            </p>
                            {s.sku && (
                              <p className="text-[10px] text-neutral-500 font-mono">SKU: {s.sku}</p>
                            )}
                          </div>
                          <span className="text-[11px] font-semibold text-[#84cc16] font-body whitespace-nowrap">
                            {(s.availableUnits || 0)} / {s.initialUnits || 0} Available
                          </span>
                        </div>
                        <div className="h-2 rounded-full bg-neutral-800 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-[#84cc16]/50 to-[#84cc16] rounded-full transition-all duration-500"
                            style={{ width: `${Math.max(0, Math.min(100, pct))}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between mt-2 text-[11px] text-neutral-500 font-body">
                          <span>Initial: {s.initialUnits || 0}</span>
                          <span>Dispatched: {s.dispatchedUnits || 0}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ─── Dispatch / Create Order from this Inbound ─── */}
            <button
              type="button"
              onClick={() => setShowOrderModal(true)}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-[#1a231d] text-[#84cc16] border border-[#84cc16]/40 rounded-2xl text-sm font-body font-semibold hover:bg-[#222e26] hover:border-[#84cc16]/60 hover:shadow-lg hover:shadow-[#84cc16]/10 active:scale-[0.99] transition-all duration-200 mb-5"
            >
              <Truck size={15} /> Dispatch / Create Order from this Inbound
            </button>

            {/* ─── Tabs ─── */}
            <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-neutral-900/80 border border-neutral-800 mb-5">
              <button
                type="button"
                onClick={() => handleTabChange("cartons")}
                className={`flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-body font-medium transition-all duration-200 ${
                  tab === "cartons"
                    ? "bg-[#1a231d] text-[#84cc16] border border-[#84cc16]/40 shadow-lg shadow-[#84cc16]/10"
                    : "text-neutral-400 hover:text-white"
                }`}
              >
                <Box size={13} /> Cartons Inventory
              </button>
              <button
                type="button"
                onClick={() => handleTabChange("orders")}
                className={`flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-body font-medium transition-all duration-200 ${
                  tab === "orders"
                    ? "bg-[#1a231d] text-[#84cc16] border border-[#84cc16]/40 shadow-lg shadow-[#84cc16]/10"
                    : "text-neutral-400 hover:text-white"
                }`}
              >
                <ClipboardList size={13} /> Associated Orders
              </button>
            </div>

            {/* ─── Tab: Cartons Inventory ─── */}
            {tab === "cartons" && (
              <div>
                {declaredCartons.length === 0 && fallbackCartons.length === 0 && (
                  <div className="text-center py-12">
                    <Box size={30} className="mx-auto text-[#84cc16]/30 mb-3" />
                    <p className="text-sm text-neutral-400 font-body">
                      No carton contents defined for this plan yet.
                    </p>
                  </div>
                )}

                {/* Declared cartons with item breakdown */}
                {declaredCartons.length > 0 && (
                  <div className="space-y-2.5">
                    {declaredCartons.map((carton) => {
                      const key = carton.cartonNumber;
                      const isOpen = expanded.has(key);
                      return (
                        <div
                          key={key}
                          className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                            isOpen
                              ? "border-[#84cc16]/30 bg-neutral-900/70"
                              : "border-neutral-800 bg-neutral-900/50 hover:border-neutral-700"
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => toggleExpanded(key)}
                            className="w-full flex items-center gap-3 px-4 py-3.5 text-left"
                          >
                            <div
                              className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${
                                isOpen
                                  ? "bg-[#84cc16]/10 border-[#84cc16]/30"
                                  : "bg-neutral-800 border-neutral-700"
                              }`}
                            >
                              <Box size={14} className={isOpen ? "text-[#84cc16]" : "text-neutral-400"} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-white font-body truncate">
                                {carton.cartonNumber}
                              </p>
                              <p className="text-[11px] text-neutral-500 font-body">
                                {carton.items.length} item{carton.items.length !== 1 ? "s" : ""} ·{" "}
                                {carton.totalItemsCount} units
                              </p>
                            </div>
                            {contentStatusBadge(carton.status)}
                            <ChevronDown
                              size={15}
                              className={`text-neutral-500 transition-transform duration-200 shrink-0 ${
                                isOpen ? "rotate-180 text-[#84cc16]" : ""
                              }`}
                            />
                          </button>

                          <AnimatePresence>
                            {isOpen && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                              >
                                <div className="px-4 pb-4">
                                  <div className="divide-y divide-neutral-800/80 rounded-xl border border-neutral-800 bg-neutral-950/40 overflow-hidden">
                                    {carton.items.map((item, idx) => (
                                      <div
                                        key={`${item.itemName}-${idx}`}
                                        className="flex items-center gap-3 px-3.5 py-2.5"
                                      >
                                        <div className="w-7 h-7 rounded-lg bg-neutral-800/70 flex items-center justify-center shrink-0">
                                          <Layers size={12} className="text-[#84cc16]" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <p className="text-xs font-medium text-white font-body truncate">
                                            {item.itemName}
                                          </p>
                                          {item.sku && (
                                            <p className="text-[10px] text-neutral-500 font-mono">
                                              SKU: {item.sku}
                                            </p>
                                          )}
                                        </div>
                                        <span className="text-xs font-bold text-[#84cc16] font-body numeric">
                                          × {item.quantity}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Physical cartons fallback */}
                {fallbackCartons.length > 0 && (
                  <div className="mt-4">
                    <p className="text-[10px] font-semibold tracking-wider text-neutral-500 uppercase mb-2 font-body">
                      Physical Cartons
                    </p>
                    <div className="space-y-1.5">
                      {fallbackCartons.map((c) => (
                        <div
                          key={c._id}
                          className="flex items-center gap-3 px-4 py-2.5 rounded-xl border border-neutral-800 bg-neutral-900/50"
                        >
                          <Box size={13} className="text-[#84cc16] shrink-0" />
                          <span className="flex-1 text-xs font-medium text-white font-body truncate">
                            {c.cartonCode}
                          </span>
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider border ${
                              c.status === "in-transit"
                                ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
                                : c.status === "arrived"
                                  ? "bg-sky-500/10 border-sky-500/30 text-sky-400"
                                  : "bg-[#84cc16]/10 border-[#84cc16]/30 text-[#84cc16]"
                            }`}
                          >
                            {c.status === "in-transit" ? "In Transit" : c.status === "arrived" ? "Arrived" : "Stored"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ─── Tab: Associated Orders ─── */}
            {tab === "orders" && (
              <div>
                {ordersLoading ? (
                  <div className="flex items-center justify-center py-14">
                    <Loader2 size={22} className="animate-spin text-[#84cc16]" />
                  </div>
                ) : associatedOrders.length === 0 ? (
                  <div className="text-center py-12">
                    <ClipboardList size={30} className="mx-auto text-[#84cc16]/30 mb-3" />
                    <p className="text-sm text-neutral-400 font-body">
                      No dispatch orders linked to this inbound plan yet.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-hidden rounded-2xl border border-neutral-800">
                    {/* Desktop header */}
                    <div className="hidden md:grid grid-cols-[1.6fr_1fr_0.8fr_1.3fr_1fr] gap-3 px-4 py-2.5 bg-neutral-900/80 border-b border-neutral-800">
                      <span className="text-[9px] font-semibold tracking-wider text-neutral-500 uppercase font-body">Customer Name</span>
                      <span className="text-[9px] font-semibold tracking-wider text-neutral-500 uppercase font-body">Phone</span>
                      <span className="text-[9px] font-semibold tracking-wider text-neutral-500 uppercase font-body">Pieces</span>
                      <span className="text-[9px] font-semibold tracking-wider text-neutral-500 uppercase font-body">Date</span>
                      <span className="text-[9px] font-semibold tracking-wider text-neutral-500 uppercase font-body">Status</span>
                    </div>
                    <div className="divide-y divide-neutral-800/80">
                      {associatedOrders.map((order) => {
                        const pieces = (order.orderedItems || []).reduce(
                          (sum, it) => sum + (it.quantity || 0),
                          0
                        );
                        return (
                          <div key={order._id} className="px-4 py-3 hover:bg-white/5 transition-colors">
                            <div className="hidden md:grid grid-cols-[1.6fr_1fr_0.8fr_1.3fr_1fr] gap-3 items-center">
                              <div className="min-w-0">
                                <p className="text-xs font-medium text-white font-body truncate">
                                  {order.customerDetails?.name || "—"}
                                </p>
                                <p className="text-[10px] text-neutral-500 font-mono truncate">
                                  {order.orderId}
                                </p>
                              </div>
                              <span className="text-xs text-neutral-400 font-body">
                                {order.customerDetails?.phone || "—"}
                              </span>
                              <span className="text-xs font-bold text-[#84cc16] font-body numeric">
                                {pieces}
                              </span>
                              <span className="text-xs text-neutral-400 font-body">
                                {formatDateTime(order.createdAt)}
                              </span>
                              <span>{orderStatusBadge(order.status)}</span>
                            </div>
                            {/* Mobile layout */}
                            <div className="md:hidden">
                              <div className="flex items-center justify-between gap-2 mb-1.5">
                                <span className="text-xs font-semibold text-white font-body truncate">
                                  {order.customerDetails?.name || "Customer"}
                                </span>
                                {orderStatusBadge(order.status)}
                              </div>
                              <div className="flex items-center gap-3 text-[11px] text-neutral-400 font-body">
                                <span>{order.customerDetails?.phone || "—"}</span>
                                <span className="text-neutral-600">·</span>
                                <span className="text-[#84cc16] font-semibold numeric">
                                  {pieces} piece{pieces !== 1 ? "s" : ""}
                                </span>
                                <span className="text-neutral-600">·</span>
                                <span>{formatDateTime(order.createdAt)}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </motion.div>

      {/* ─── Create Order Modal (pre-linked to this inbound's stock) ─── */}
      {showOrderModal && (
        <CreateOrderModal
          sourcePlan={{
            planId: p._id,
            warehouseId,
            warehouseName:
              typeof p.warehouse === "string"
                ? "Warehouse"
                : p.warehouse?.name || "Warehouse",
            batchName: p.batchName || plan.batchName || "Inbound Plan",
            stock: availableStock,
          }}
          onClose={() => setShowOrderModal(false)}
          onCreated={() => {
            setShowOrderModal(false);
            // Refresh the associated-orders list so the new order shows up
            if (tab === "orders") fetchOrders();
          }}
        />
      )}
    </motion.div>
  );
}
