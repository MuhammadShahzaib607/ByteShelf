"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  User,
  FileUp,
  PenLine,
  Loader2,
  MapPin,
  Phone,
  House,
  Building2,
  Minus,
  Plus,
  Truck,
  CheckCircle,
  AlertCircle,
  ClipboardList,
  Warehouse,
  FileText,
  Package,
} from "lucide-react";
import api from "@/lib/axios";
import OrderTimeline from "./OrderTimeline";

// ─── Types ──────────────────────────────────────────────────────────────────────

interface StockItem {
  itemName: string;
  sku: string;
  quantity: number;
}

interface StockWarehouse {
  warehouseId: string;
  warehouseName: string;
  items: StockItem[];
}

interface PdfPreview {
  customerDetails: { name: string; phone: string; address: string; city: string };
  orderedItems: Array<{ itemName: string; sku?: string; quantity: number }>;
}

interface SourcePlan {
  planId: string;
  warehouseId: string;
  warehouseName: string;
  batchName: string;
  stock: Array<{ itemName: string; sku?: string; quantity: number }>;
}

interface CreatedOrder {
  _id: string;
  orderId: string;
  status: string;
  trackingId?: string | null;
  dispatchTimestamp?: string | null;
  customerDetails: { name: string };
}

// ─── Helpers ────────────────────────────────────────────────────────────────────

const itemKey = (item: { itemName: string; sku?: string }) => {
  const sku = (item.sku || "").trim().toLowerCase();
  const name = (item.itemName || "").trim().toLowerCase();
  return sku ? `sku:${sku}` : `name:${name}`;
};

function inputCls(): string {
  return "w-full px-4 py-3 bg-neutral-900/80 border border-neutral-800 rounded-xl text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:border-[#84cc16] focus:bg-neutral-900 transition-all font-body";
}

function labelCls(): string {
  return "text-xs font-semibold tracking-wider text-white uppercase mb-1.5 block font-body";
}

// ─── Component ──────────────────────────────────────────────────────────────────

export default function CreateOrderModal({
  onClose,
  onCreated,
  sourcePlan,
}: {
  onClose: () => void;
  onCreated?: (order: CreatedOrder) => void;
  sourcePlan?: SourcePlan;
}) {
  const [tab, setTab] = useState<"manual" | "pdf">("manual");

  // ─── Stock + warehouse selection ───────────────────────────────────────
  const [stock, setStock] = useState<StockWarehouse[]>([]);
  const [stockLoading, setStockLoading] = useState(true);
  const [warehouseId, setWarehouseId] = useState(sourcePlan?.warehouseId || "");

  // ─── Manual tab state ──────────────────────────────────────────────────
  const [customer, setCustomer] = useState({
    name: "",
    phone: "",
    address: "",
    city: "",
  });
  const [selected, setSelected] = useState<Record<string, number>>({});

  // ─── PDF tab state ─────────────────────────────────────────────────────
  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [preview, setPreview] = useState<PdfPreview | null>(null);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [previewCustomer, setPreviewCustomer] = useState({
    name: "",
    phone: "",
    address: "",
    city: "",
  });
  const [previewItems, setPreviewItems] = useState<
    Array<{ itemName: string; sku?: string; quantity: number }>
  >([]);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ─── Submit state ──────────────────────────────────────────────────────
  const [creating, setCreating] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [created, setCreated] = useState<CreatedOrder | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  // ─── Load available stock ──────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get("/order/stock");
        if (cancelled) return;
        const data: StockWarehouse[] = Array.isArray(res.data.data) ? res.data.data : [];
        setStock(data);
        if (data.length > 0) setWarehouseId((prev) => prev || sourcePlan?.warehouseId || data[0].warehouseId);
      } catch {
        /* ignore */
      } finally {
        if (!cancelled) setStockLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // sourcePlan.warehouseId is stable while the modal is open (the modal is
    // remounted on each open), so this effect only needs to run once.
  }, [sourcePlan?.warehouseId]);

  const selectedWarehouse = stock.find((w) => w.warehouseId === warehouseId) || null;
  // When opened from a specific inbound plan, the selectable stock is that
  // plan's remaining stock — clamped so the merchant can never over-order.
  const usableItems: StockItem[] = sourcePlan
    ? sourcePlan.stock
        .filter((it) => it.quantity > 0)
        .map((it) => ({ itemName: it.itemName, sku: it.sku || "", quantity: it.quantity }))
    : (selectedWarehouse?.items || []).filter((it) => it.quantity > 0);

  const toggleItem = useCallback((item: StockItem, delta: number) => {
    setSelected((prev) => {
      const key = itemKey(item);
      const current = prev[key] || 0;
      const next = Math.min(item.quantity, Math.max(0, current + delta));
      const copy = { ...prev };
      if (next === 0) delete copy[key];
      else copy[key] = next;
      return copy;
    });
  }, []);

  const manualItems = Object.entries(selected)
    .map(([key, qty]) => {
      const item = usableItems.find((it) => itemKey(it) === key);
      return item ? { itemName: item.itemName, sku: item.sku || "", quantity: qty } : null;
    })
    .filter(Boolean) as Array<{ itemName: string; sku: string; quantity: number }>;

  const customerValid =
    customer.name.trim() &&
    customer.phone.trim() &&
    customer.address.trim() &&
    customer.city.trim();

  // ─── Pre-submit confirmation summary ───────────────────────────────────
  const confirmItems =
    tab === "manual"
      ? manualItems
      : previewItems
          .filter((it) => it.itemName.trim() && it.quantity > 0)
          .map((it) => ({
            itemName: it.itemName.trim(),
            sku: it.sku || "",
            quantity: Number(it.quantity) || 1,
          }));
  const confirmCustomer = tab === "manual" ? customer : previewCustomer;
  const confirmWarehouse = sourcePlan
    ? sourcePlan.warehouseName
    : selectedWarehouse?.warehouseName || "Warehouse";

  // ─── PDF file handlers ─────────────────────────────────────────────────
  const handleParsePdf = useCallback(async (f: File) => {
    setFile(f);
    setParsing(true);
    setPdfError(null);
    setPreview(null);
    try {
      const form = new FormData();
      form.append("file", f);
      const res = await api.post("/order/parse-pdf", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const data = res.data.data;
      setPreview(data);
      setPreviewCustomer({
        name: data.customerDetails?.name || "",
        phone: data.customerDetails?.phone || "",
        address: data.customerDetails?.address || "",
        city: data.customerDetails?.city || "",
      });
      setPreviewItems(
        Array.isArray(data.orderedItems)
          ? data.orderedItems.map((it: any) => ({
              itemName: it.itemName,
              sku: it.sku || "",
              quantity: Number(it.quantity) || 1,
            }))
          : []
      );
    } catch (err: any) {
      setPdfError(err.response?.data?.message || "Failed to parse the PDF. Please try again.");
    } finally {
      setParsing(false);
    }
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const f = e.dataTransfer.files?.[0];
      if (f) {
        if (!f.type.includes("pdf") && !f.name.toLowerCase().endsWith(".pdf")) {
          setPdfError("Only PDF files are allowed.");
          return;
        }
        handleParsePdf(f);
      }
    },
    [handleParsePdf]
  );

  // ─── Submit order ──────────────────────────────────────────────────────
  const submitOrder = async (source: "Manual" | "AI_PDF_Extraction") => {
    if (!warehouseId) {
      setSubmitError("Please select a warehouse with available stock.");
      return;
    }
    const items =
      source === "Manual"
        ? manualItems
        : previewItems
            .filter((it) => it.itemName.trim() && it.quantity > 0)
            .map((it) => ({
              itemName: it.itemName.trim(),
              sku: it.sku || "",
              quantity: Number(it.quantity) || 1,
            }));
    const customerDetails = source === "Manual" ? customer : previewCustomer;

    if (items.length === 0) {
      setSubmitError("Please select at least one item.");
      return;
    }
    if (
      !customerDetails.name.trim() ||
      !customerDetails.phone.trim() ||
      !customerDetails.address.trim() ||
      !customerDetails.city.trim()
    ) {
      setSubmitError("Please fill in the customer details.");
      return;
    }

    setCreating(true);
    setSubmitError(null);
    try {
      const res = await api.post("/order/create", {
        warehouseId,
        planId: sourcePlan?.planId || undefined,
        customerDetails,
        orderedItems: items,
        source,
      });
      const order = res.data.data;
      setCreated(order);
      onCreated?.(order);
    } catch (err: any) {
      setSubmitError(
        err.response?.data?.message || "Failed to create the order. Please try again."
      );
    } finally {
      setCreating(false);
    }
  };

  // ─── Success view ──────────────────────────────────────────────────────
  if (created) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] flex items-start justify-center p-4 pt-16 sm:pt-24 bg-black/70 backdrop-blur-sm overflow-y-auto"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="w-full max-w-lg bg-[#111614] rounded-3xl shadow-2xl border border-neutral-800/80 p-6 sm:p-8 relative"
        >
          <button
            onClick={onClose}
            className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/10 border border-neutral-800 flex items-center justify-center text-neutral-400 hover:bg-white/20 hover:text-white transition-all z-10"
          >
            <X size={16} />
          </button>

          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-[#84cc16]/10 border border-[#84cc16]/40 flex items-center justify-center shrink-0">
              <CheckCircle size={24} className="text-[#84cc16]" />
            </div>
            <div>
              <h2 className="font-heading text-xl font-bold text-white">Order Created!</h2>
              <p className="text-sm text-neutral-400 font-body">
                The warehouse owner has been notified.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-neutral-900/80 border border-neutral-800 flex items-center justify-between mb-6">
            <div>
              <p className="text-[10px] font-semibold tracking-wider text-neutral-500 uppercase font-body">
                Order ID
              </p>
              <p className="text-sm font-bold text-[#84cc16] font-mono mt-0.5">{created.orderId}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-semibold tracking-wider text-neutral-500 uppercase font-body">
                Customer
              </p>
              <p className="text-sm font-semibold text-white font-body mt-0.5">
                {created.customerDetails?.name || "—"}
              </p>
            </div>
          </div>

          <OrderTimeline status={created.status} trackingId={created.trackingId} dispatchTimestamp={created.dispatchTimestamp} />

          <div className="mt-8 flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 bg-[#1a231d] text-[#84cc16] border border-[#84cc16]/40 rounded-full text-sm font-body font-semibold hover:bg-[#222e26] hover:border-[#84cc16]/60 hover:shadow-lg hover:shadow-[#84cc16]/10 active:scale-95 transition-all duration-200"
            >
              <CheckCircle size={16} /> Done
            </button>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-start justify-center p-4 pt-16 sm:pt-20 bg-black/70 backdrop-blur-sm overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full max-w-2xl bg-[#111614] rounded-3xl shadow-2xl border border-neutral-800/80 overflow-hidden relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-[#111614]/95 backdrop-blur-md border-b border-neutral-800 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#84cc16]/10 border border-[#84cc16]/30 flex items-center justify-center">
              <ClipboardList size={19} className="text-[#84cc16]" />
            </div>
            <div>
              <h2 className="font-heading text-lg font-semibold text-white">Create Dispatch Order</h2>
              <p className="text-xs text-neutral-400 font-body">Fulfill an order from your stored inventory</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 border border-neutral-800 flex items-center justify-center text-neutral-400 hover:bg-white/20 hover:text-white transition-all"
          >
            <X size={16} />
          </button>
        </div>

        {/* Tabs */}
        <div className="px-6 pt-5">
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-neutral-900/80 border border-neutral-800">
            <button
              type="button"
              onClick={() => setTab("manual")}
              className={`flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-body font-medium transition-all duration-200 ${
                tab === "manual"
                  ? "bg-[#1a231d] text-[#84cc16] border border-[#84cc16]/40 shadow-lg shadow-[#84cc16]/10"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              <PenLine size={13} /> Manual Entry
            </button>
            <button
              type="button"
              onClick={() => setTab("pdf")}
              className={`flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-body font-medium transition-all duration-200 ${
                tab === "pdf"
                  ? "bg-[#1a231d] text-[#84cc16] border border-[#84cc16]/40 shadow-lg shadow-[#84cc16]/10"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              <FileUp size={13} /> AI PDF Import
            </button>
          </div>
        </div>

        <div className="p-6 max-h-[calc(100vh-220px)] overflow-y-auto">
          {/* Stock loading */}
          {stockLoading && !sourcePlan ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={24} className="animate-spin text-[#84cc16]" />
            </div>
          ) : stock.length === 0 && !sourcePlan ? (
            <div className="text-center py-12">
              <Warehouse size={32} className="mx-auto text-[#84cc16]/30 mb-3" />
              <h3 className="font-heading text-lg font-semibold text-white mb-2">No available stock</h3>
              <p className="text-sm text-neutral-400 font-body max-w-sm mx-auto">
                Create an inbound plan with carton contents first — dispatch orders are fulfilled from your stored inventory.
              </p>
            </div>
          ) : tab === "manual" ? (
            <div className="space-y-5">
              {/* Pre-linked inbound stock banner */}
              {sourcePlan && (
                <div className="p-4 rounded-2xl bg-[#84cc16]/5 border border-[#84cc16]/30">
                  <div className="flex items-center gap-2 mb-2.5">
                    <Package size={15} className="text-[#84cc16]" />
                    <p className="text-xs font-semibold text-[#84cc16] font-body uppercase tracking-wider">
                      Available Stock · {sourcePlan.batchName}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {sourcePlan.stock.filter((it) => it.quantity > 0).map((it) => (
                      <span
                        key={itemKey(it)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#1a231d] border border-[#84cc16]/30 text-xs font-semibold text-[#84cc16] font-body"
                      >
                        {it.quantity} × {it.itemName}
                      </span>
                    ))}
                    {sourcePlan.stock.filter((it) => it.quantity > 0).length === 0 && (
                      <span className="text-xs text-amber-400 font-body">
                        This inbound has no remaining units available to dispatch.
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Warehouse selector (read-only when pre-linked to an inbound) */}
              <div>
                <label className={labelCls()}>Dispatch Warehouse</label>
                {sourcePlan ? (
                  <div className="flex items-center gap-2.5 px-4 py-3 bg-neutral-900/80 border border-neutral-800 rounded-xl text-sm text-white font-body">
                    <Warehouse size={16} className="text-[#84cc16]/70" />
                    <span className="font-medium">{sourcePlan.warehouseName}</span>
                  </div>
                ) : (
                  <div className="relative">
                    <Warehouse size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#84cc16]/60 pointer-events-none" />
                    <select
                      value={warehouseId}
                      onChange={(e) => {
                        setWarehouseId(e.target.value);
                        setSelected({});
                      }}
                      className="w-full pl-11 pr-4 py-3 bg-neutral-900/80 border border-neutral-800 rounded-xl text-sm text-white [color-scheme:dark] focus:outline-none focus:border-[#84cc16] focus:bg-neutral-900 transition-all font-body appearance-none"
                    >
                      {stock.map((w) => (
                        <option key={w.warehouseId} value={w.warehouseId}>
                          {w.warehouseName}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Customer details */}
              <div>
                <p className={labelCls()}>Customer Details</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="relative">
                    <User size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#84cc16]/60 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Customer Name"
                      value={customer.name}
                      onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                      className={`${inputCls()} pl-10`}
                    />
                  </div>
                  <div className="relative">
                    <Phone size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#84cc16]/60 pointer-events-none" />
                    <input
                      type="tel"
                      placeholder="Phone Number"
                      value={customer.phone}
                      onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
                      className={`${inputCls()} pl-10`}
                    />
                  </div>
                  <div className="relative sm:col-span-2">
                    <House size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#84cc16]/60 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Delivery Address"
                      value={customer.address}
                      onChange={(e) => setCustomer({ ...customer, address: e.target.value })}
                      className={`${inputCls()} pl-10`}
                    />
                  </div>
                  <div className="relative sm:col-span-2">
                    <Building2 size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#84cc16]/60 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="City"
                      value={customer.city}
                      onChange={(e) => setCustomer({ ...customer, city: e.target.value })}
                      className={`${inputCls()} pl-10`}
                    />
                  </div>
                </div>
              </div>

              {/* Stock items */}
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <p className={labelCls()}>Select Items from Stock</p>
                  <span className="text-[11px] text-neutral-500 font-body">
                    {manualItems.length} item{manualItems.length !== 1 ? "s" : ""} selected
                  </span>
                </div>

                {usableItems.length === 0 ? (
                  <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-400 font-body">
                    No available stock in this warehouse. Define carton contents on your inbound plans to build inventory.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {usableItems.map((item) => {
                      const key = itemKey(item);
                      const qty = selected[key] || 0;
                      const isMaxed = qty >= item.quantity;
                      return (
                        <div
                          key={key}
                          className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-200 ${
                            qty > 0
                              ? "border-[#84cc16]/40 bg-[#1a231d]/80"
                              : "border-neutral-800 bg-neutral-900/50 hover:border-neutral-700"
                          }`}
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white font-body truncate">{item.itemName}</p>
                            <div className="flex items-center gap-2 text-[11px] text-neutral-500 font-body">
                              {item.sku && <span className="font-mono">SKU: {item.sku}</span>}
                              <span className="flex items-center gap-1">
                                <MapPin size={10} className="text-[#84cc16]/70" />
                                {item.quantity} available
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => toggleItem(item, -1)}
                              disabled={qty === 0}
                              className="w-7 h-7 rounded-lg border border-neutral-700 flex items-center justify-center text-neutral-400 hover:text-white hover:border-[#84cc16]/50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                            >
                              <Minus size={13} />
                            </button>
                            <span className={`w-8 text-center text-sm font-bold font-body numeric ${qty > 0 ? "text-[#84cc16]" : "text-neutral-500"}`}>
                              {qty}
                            </span>
                            <button
                              type="button"
                              onClick={() => toggleItem(item, 1)}
                              disabled={isMaxed}
                              className="w-7 h-7 rounded-lg border border-neutral-700 flex items-center justify-center text-neutral-400 hover:text-white hover:border-[#84cc16]/50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                            >
                              <Plus size={13} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* ─── PDF TAB ─── */
            <div className="space-y-5">
              {!preview ? (
                <>
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragOver(true);
                    }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={onDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`cursor-pointer border-2 border-dashed rounded-2xl p-10 text-center transition-all duration-200 ${
                      dragOver
                        ? "border-[#84cc16] bg-[#84cc16]/5"
                        : "border-neutral-700 bg-neutral-900/40 hover:border-[#84cc16]/40 hover:bg-[#84cc16]/5"
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="application/pdf,.pdf"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) {
                          if (!f.type.includes("pdf") && !f.name.toLowerCase().endsWith(".pdf")) {
                            setPdfError("Only PDF files are allowed.");
                            return;
                          }
                          handleParsePdf(f);
                        }
                        e.target.value = "";
                      }}
                    />
                    {parsing ? (
                      <>
                        <Loader2 size={30} className="animate-spin text-[#84cc16] mx-auto mb-3" />
                        <p className="text-sm text-white font-body font-medium">Extracting order details from PDF...</p>
                        <p className="text-xs text-neutral-500 font-body mt-1">Reading invoice layout & line items</p>
                      </>
                    ) : (
                      <>
                        <div className="w-14 h-14 rounded-2xl bg-[#84cc16]/10 border border-[#84cc16]/30 flex items-center justify-center mx-auto mb-4">
                          <FileUp size={24} className="text-[#84cc16]" />
                        </div>
                        <p className="text-sm font-semibold text-white font-body">
                          Drag & drop your invoice / order PDF here
                        </p>
                        <p className="text-xs text-neutral-500 font-body mt-1">
                          or click to browse · extracts customer name, address & line items
                        </p>
                      </>
                    )}
                  </div>
                  {pdfError && (
                    <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-2.5">
                      <AlertCircle size={14} className="text-red-400 shrink-0 mt-0.5" />
                      <p className="text-xs text-red-400 font-body">{pdfError}</p>
                    </div>
                  )}
                  {file && !parsing && !preview && (
                    <div className="p-3 rounded-xl bg-neutral-900/80 border border-neutral-800 flex items-center gap-3">
                      <FileText size={15} className="text-[#84cc16] shrink-0" />
                      <span className="text-xs text-white font-body truncate flex-1">{file.name}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setFile(null);
                          setPdfError(null);
                        }}
                        className="text-[11px] text-neutral-400 hover:text-red-400 font-body transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </>
              ) : (
                /* ─── Confirmation preview ─── */
                <>
                  <div className="p-4 rounded-2xl bg-[#84cc16]/5 border border-[#84cc16]/30 flex items-start gap-3">
                    <CheckCircle size={17} className="text-[#84cc16] shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-white font-body">Order details extracted</p>
                      <p className="text-xs text-neutral-400 font-body mt-0.5">
                        Review the preview below — everything is editable before saving.
                      </p>
                    </div>
                  </div>

                  {/* Warehouse (read-only when pre-linked to an inbound) */}
                  <div>
                    <label className={labelCls()}>Dispatch Warehouse</label>
                    {sourcePlan ? (
                      <div className="flex items-center gap-2.5 px-4 py-3 bg-neutral-900/80 border border-neutral-800 rounded-xl text-sm text-white font-body">
                        <Warehouse size={16} className="text-[#84cc16]/70" />
                        <span className="font-medium">{sourcePlan.warehouseName}</span>
                      </div>
                    ) : (
                      <select
                        value={warehouseId}
                        onChange={(e) => setWarehouseId(e.target.value)}
                        className="w-full px-4 py-3 bg-neutral-900/80 border border-neutral-800 rounded-xl text-sm text-white [color-scheme:dark] focus:outline-none focus:border-[#84cc16] transition-all font-body"
                      >
                        {stock.map((w) => (
                          <option key={w.warehouseId} value={w.warehouseId}>
                            {w.warehouseName}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  {/* Customer preview */}
                  <div>
                    <p className={labelCls()}>Customer Details</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input
                        type="text"
                        placeholder="Customer Name"
                        value={previewCustomer.name}
                        onChange={(e) => setPreviewCustomer({ ...previewCustomer, name: e.target.value })}
                        className={inputCls()}
                      />
                      <input
                        type="tel"
                        placeholder="Phone Number"
                        value={previewCustomer.phone}
                        onChange={(e) => setPreviewCustomer({ ...previewCustomer, phone: e.target.value })}
                        className={inputCls()}
                      />
                      <input
                        type="text"
                        placeholder="Delivery Address"
                        value={previewCustomer.address}
                        onChange={(e) => setPreviewCustomer({ ...previewCustomer, address: e.target.value })}
                        className={`${inputCls()} sm:col-span-2`}
                      />
                      <input
                        type="text"
                        placeholder="City"
                        value={previewCustomer.city}
                        onChange={(e) => setPreviewCustomer({ ...previewCustomer, city: e.target.value })}
                        className={`${inputCls()} sm:col-span-2`}
                      />
                    </div>
                  </div>

                  {/* Items preview */}
                  <div>
                    <p className={labelCls()}>Ordered Items</p>
                    <div className="space-y-2">
                      {previewItems.map((it, idx) => (
                        <div
                          key={`${it.itemName}-${idx}`}
                          className="flex items-center gap-3 px-4 py-2.5 rounded-xl border border-neutral-800 bg-neutral-900/50"
                        >
                          <div className="flex-1 min-w-0">
                            <input
                              type="text"
                              value={it.itemName}
                              onChange={(e) => {
                                const next = [...previewItems];
                                next[idx] = { ...next[idx], itemName: e.target.value };
                                setPreviewItems(next);
                              }}
                              className="w-full bg-transparent text-sm text-white font-body focus:outline-none"
                            />
                            <input
                              type="text"
                              placeholder="SKU (optional)"
                              value={it.sku || ""}
                              onChange={(e) => {
                                const next = [...previewItems];
                                next[idx] = { ...next[idx], sku: e.target.value };
                                setPreviewItems(next);
                              }}
                              className="w-full bg-transparent text-[11px] text-neutral-500 font-mono focus:outline-none"
                            />
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                const next = [...previewItems];
                                next[idx] = { ...next[idx], quantity: Math.max(1, it.quantity - 1) };
                                setPreviewItems(next);
                              }}
                              className="w-7 h-7 rounded-lg border border-neutral-700 flex items-center justify-center text-neutral-400 hover:text-white hover:border-[#84cc16]/50 transition-all"
                            >
                              <Minus size={13} />
                            </button>
                            <input
                              type="number"
                              min={1}
                              value={it.quantity}
                              onChange={(e) => {
                                const next = [...previewItems];
                                next[idx] = { ...next[idx], quantity: Math.max(1, parseInt(e.target.value) || 1) };
                                setPreviewItems(next);
                              }}
                              className="w-12 text-center bg-neutral-900 border border-neutral-700 rounded-lg text-sm font-bold text-[#84cc16] font-body numeric [color-scheme:dark] focus:outline-none focus:border-[#84cc16] py-1.5"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const next = [...previewItems];
                                next[idx] = { ...next[idx], quantity: it.quantity + 1 };
                                setPreviewItems(next);
                              }}
                              className="w-7 h-7 rounded-lg border border-neutral-700 flex items-center justify-center text-neutral-400 hover:text-white hover:border-[#84cc16]/50 transition-all"
                            >
                              <Plus size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setPreviewItems(previewItems.filter((_, i) => i !== idx))}
                              className="ml-1 w-7 h-7 rounded-lg border border-red-500/30 flex items-center justify-center text-red-400 hover:bg-red-500/10 transition-all"
                            >
                              <X size={13} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Submit error */}
          {submitError && (
            <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-2.5">
              <AlertCircle size={14} className="text-red-400 shrink-0 mt-0.5" />
              <p className="text-xs text-red-400 font-body">{submitError}</p>
            </div>
          )}
        </div>

        {/* ─── Pre-submit confirmation modal ─── */}
        <AnimatePresence>
          {confirmOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[70] flex items-start justify-center p-4 pt-24 sm:pt-28 bg-black/70 backdrop-blur-sm overflow-y-auto"
              onClick={(e) => {
                if (e.target === e.currentTarget && !creating) setConfirmOpen(false);
              }}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="w-full max-w-md bg-[#111614] rounded-3xl shadow-2xl border border-neutral-800/80 p-6 sm:p-8"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-2xl bg-[#84cc16]/10 border border-[#84cc16]/30 flex items-center justify-center">
                    <Truck size={20} className="text-[#84cc16]" />
                  </div>
                  <div>
                    <h2 className="font-heading text-lg font-semibold text-white">Confirm Dispatch Order</h2>
                    <p className="text-xs text-neutral-400 font-body">Stock is deducted automatically once confirmed</p>
                  </div>
                </div>

                <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                  {confirmItems.map((it) => {
                    const entry = (sourcePlan
                      ? sourcePlan.stock
                      : selectedWarehouse?.items || []
                    ).find((s) => itemKey(s) === itemKey(it));
                    const remaining =
                      entry === undefined
                        ? null
                        : Math.max(0, entry.quantity - it.quantity);
                    return (
                      <div key={itemKey(it)} className="p-4 rounded-2xl bg-neutral-900/60 border border-neutral-800">
                        <p className="text-sm text-white font-body leading-relaxed">
                          Confirm dispatching{" "}
                          <span className="font-bold text-[#84cc16]">{it.quantity}</span> piece
                          {it.quantity !== 1 ? "s" : ""} of{" "}
                          <span className="font-semibold text-white">{it.itemName}</span> to{" "}
                          <span className="font-semibold text-white">{confirmCustomer.name}</span>{" "}
                          ({confirmCustomer.phone})?
                        </p>
                        <p className="mt-2 text-[11px] text-neutral-500 font-body">
                          {remaining === null ? (
                            <>
                              Stock will be verified by the system before dispatch.
                            </>
                          ) : (
                            <>
                              Remaining stock will be{" "}
                              <span className="font-semibold text-[#84cc16]">{remaining}</span>.
                            </>
                          )}
                        </p>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-3 p-3 rounded-xl bg-neutral-900/50 border border-neutral-800 flex items-center gap-2 text-[11px] text-neutral-400 font-body">
                  <Warehouse size={13} className="text-[#84cc16] shrink-0" />
                  <span className="truncate">Dispatch from {confirmWarehouse}</span>
                </div>

                <div className="mt-6 flex items-center gap-3">
                  <button
                    onClick={() => {
                      setConfirmOpen(false);
                      submitOrder(tab === "manual" ? "Manual" : "AI_PDF_Extraction");
                    }}
                    disabled={creating}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 bg-[#1a231d] text-[#84cc16] border border-[#84cc16]/40 rounded-full text-sm font-body font-semibold hover:bg-[#222e26] hover:border-[#84cc16]/60 hover:shadow-lg hover:shadow-[#84cc16]/10 active:scale-95 transition-all duration-200 disabled:opacity-50"
                  >
                    {creating ? (
                      <>
                        <Loader2 size={16} className="animate-spin" /> Creating...
                      </>
                    ) : (
                      <>
                        <CheckCircle size={16} /> Confirm & Create Order
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => setConfirmOpen(false)}
                    disabled={creating}
                    className="px-5 py-3 border border-neutral-800 text-neutral-400 rounded-full text-sm font-body hover:bg-white/5 transition-colors disabled:opacity-50"
                  >
                    Back
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer actions */}
        <div className="sticky bottom-0 bg-[#111614]/95 backdrop-blur-md border-t border-neutral-800 px-6 py-4 flex items-center gap-3">
          <button
            onClick={onClose}
            className="px-5 py-3 border border-neutral-800 text-neutral-400 rounded-full text-sm font-body hover:bg-white/5 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => setConfirmOpen(true)}
            disabled={
              creating ||
              (!sourcePlan && stock.length === 0) ||
              (tab === "manual" ? !customerValid || manualItems.length === 0 : !preview)
            }
            className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 bg-[#1a231d] text-[#84cc16] border border-[#84cc16]/40 rounded-full text-sm font-body font-semibold hover:bg-[#222e26] hover:border-[#84cc16]/60 hover:shadow-lg hover:shadow-[#84cc16]/10 active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {creating ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Creating Order...
              </>
            ) : tab === "manual" ? (
              <>
                <Truck size={16} /> Create Order
              </>
            ) : (
              <>
                <CheckCircle size={16} /> Save & Create Order
              </>
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
