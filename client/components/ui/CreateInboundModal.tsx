"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  X,
  Package,
  Loader2,
  AlertCircle,
  CheckCircle,
  Send,
  Box,
  Hash,
  CalendarDays,
  Layers,
  Warehouse,
  Sparkles,
} from "lucide-react";
import api from "@/lib/axios";

// ─── Types ──────────────────────────────────────────────────────────────────────

interface BookingRef {
  _id: string;
  warehouseName?: string;
  warehouse?: { _id: string; name: string };
}

interface Props {
  booking: BookingRef;
  onClose: () => void;
  onCreated?: (planId: string) => void;
}

// ─── Helpers ────────────────────────────────────────────────────────────────────

function inputCls(): string {
  return "w-full px-4 py-3 bg-neutral-900/80 border border-neutral-800 rounded-xl text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:border-[#84cc16] focus:bg-neutral-900 transition-all font-body";
}

function labelCls(): string {
  return "text-xs font-semibold tracking-wider text-white uppercase mb-1.5 block font-body";
}

// ─── Component ──────────────────────────────────────────────────────────────────

export default function CreateInboundModal({ booking, onClose, onCreated }: Props) {
  const warehouseName =
    booking.warehouseName || booking.warehouse?.name || "Warehouse";

  // ─── Form state (single item per shipment) ─────────────────────────────
  const [itemName, setItemName] = useState("");
  const [sku, setSku] = useState("");
  const [totalCartons, setTotalCartons] = useState(1);
  const [itemsPerCarton, setItemsPerCarton] = useState(1);
  const [expectedDate, setExpectedDate] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  // ─── Flow state: form → confirmation → submitting → success ───────────
  const [step, setStep] = useState<"form" | "confirm" | "success">("form");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [createdPlanId, setCreatedPlanId] = useState<string | null>(null);

  const totalItems = Math.max(0, totalCartons * itemsPerCarton);

  const openConfirm = useCallback(() => {
    setFormError(null);
    if (!itemName.trim()) {
      setFormError("Please enter the item name.");
      return;
    }
    if (totalCartons < 1) {
      setFormError("Total cartons must be at least 1.");
      return;
    }
    if (itemsPerCarton < 1) {
      setFormError("Items per carton must be at least 1.");
      return;
    }
    if (!expectedDate) {
      setFormError("Please select the expected arrival date.");
      return;
    }
    setStep("confirm");
  }, [itemName, totalCartons, itemsPerCarton, expectedDate]);

  const handleSubmit = useCallback(async () => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await api.post("/inbound/create", {
        bookingId: booking._id,
        batchName: `${itemName.trim()} Shipment`,
        expectedDate,
        items: [
          {
            itemName: itemName.trim(),
            sku: sku.trim(),
            totalCartons,
            itemsPerCarton,
          },
        ],
      });
      const planId = res.data.data?._id || "";
      setCreatedPlanId(planId);
      setStep("success");
      onCreated?.(planId);
    } catch (err: any) {
      setSubmitError(
        err.response?.data?.message || "Failed to create the inbound plan."
      );
    } finally {
      setSubmitting(false);
    }
  }, [booking._id, itemName, sku, totalCartons, itemsPerCarton, expectedDate, onCreated]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-start justify-center p-4 pt-16 sm:pt-20 bg-black/70 backdrop-blur-sm overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget && !submitting) onClose();
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full max-w-lg bg-[#111614] rounded-3xl shadow-2xl border border-neutral-800/80 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ─── Success view ─── */}
        {step === "success" ? (
          <div className="p-8 text-center">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={28} className="text-emerald-400" />
            </div>
            <h2 className="font-heading text-xl font-bold text-white mb-2">
              Inbound Plan Created!
            </h2>
            <p className="text-sm text-neutral-400 font-body mb-5">
              {totalCartons} carton{totalCartons !== 1 ? "s" : ""} containing{" "}
              {totalItems.toLocaleString("en-PK")} piece
              {totalItems !== 1 ? "s" : ""} of {itemName.trim()} are on the way
              to {warehouseName}. The warehouse owner has been notified.
            </p>
            <div className="flex items-center justify-between bg-neutral-900/80 border border-neutral-800 rounded-xl p-3 mb-5">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-[10px] text-neutral-500 uppercase font-semibold tracking-wider font-body">
                  PLAN ID:
                </span>
                <code className="text-xs font-mono text-[#84cc16] font-medium break-all">
                  {createdPlanId}
                </code>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#1a231d] text-[#84cc16] border border-[#84cc16]/40 rounded-full text-sm font-body font-semibold hover:bg-[#222e26] hover:border-[#84cc16]/60 hover:shadow-lg hover:shadow-[#84cc16]/10 active:scale-95 transition-all duration-200"
            >
              <CheckCircle size={16} /> Done
            </button>
          </div>
        ) : (
          <div className="p-6 sm:p-8">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-2xl bg-[#84cc16]/10 border border-[#84cc16]/30 flex items-center justify-center">
                <Package size={20} className="text-[#84cc16]" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="font-heading text-lg font-semibold text-white">
                  {step === "confirm" ? "Confirm Inbound Shipment" : "Create Inbound Shipment"}
                </h2>
                <p className="text-xs text-neutral-400 font-body truncate">
                  for {warehouseName}
                </p>
              </div>
              <button
                onClick={onClose}
                disabled={submitting}
                className="w-8 h-8 rounded-full bg-white/10 border border-neutral-800 flex items-center justify-center text-neutral-400 hover:bg-white/20 hover:text-white transition-all disabled:opacity-50 shrink-0"
              >
                <X size={16} />
              </button>
            </div>

            {step === "form" ? (
              /* ─── FORM STEP ─── */
              <div className="space-y-4">
                <div>
                  <label className={labelCls()}>Item Name</label>
                  <div className="relative">
                    <Layers size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#84cc16]/60 pointer-events-none" />
                    <input
                      type="text"
                      value={itemName}
                      onChange={(e) => setItemName(e.target.value)}
                      placeholder="e.g. Cotton T-Shirts"
                      className={`${inputCls()} pl-10`}
                    />
                  </div>
                </div>

                <div>
                  <label className={labelCls()}>SKU / Item Code</label>
                  <div className="relative">
                    <Hash size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#84cc16]/60 pointer-events-none" />
                    <input
                      type="text"
                      value={sku}
                      onChange={(e) => setSku(e.target.value)}
                      placeholder="Optional — leave blank to auto-generate"
                      className={`${inputCls()} pl-10`}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls()}>Total Cartons</label>
                    <input
                      type="number"
                      min={1}
                      value={totalCartons}
                      onChange={(e) =>
                        setTotalCartons(Math.max(1, parseInt(e.target.value) || 1))
                      }
                      className={`${inputCls()} [color-scheme:dark]`}
                    />
                  </div>
                  <div>
                    <label className={labelCls()}>Items / Carton</label>
                    <input
                      type="number"
                      min={1}
                      value={itemsPerCarton}
                      onChange={(e) =>
                        setItemsPerCarton(Math.max(1, parseInt(e.target.value) || 1))
                      }
                      className={`${inputCls()} [color-scheme:dark]`}
                    />
                  </div>
                </div>

                {/* Auto-calculated total items */}
                <div className="flex items-center justify-between p-4 rounded-2xl bg-gradient-to-br from-neutral-800/80 to-neutral-900/80 border border-[#84cc16]/30">
                  <div className="flex items-center gap-2">
                    <Box size={15} className="text-[#84cc16]" />
                    <span className="text-xs font-semibold text-white font-body uppercase tracking-wider">
                      Total Items
                    </span>
                  </div>
                  <span className="font-heading text-xl font-bold text-[#84cc16] numeric">
                    {totalItems.toLocaleString("en-PK")}
                  </span>
                </div>
                <p className="-mt-2 text-[11px] text-neutral-500 font-body">
                  Auto-calculated: {totalCartons} carton{totalCartons !== 1 ? "s" : ""} ×{" "}
                  {itemsPerCarton} piece{itemsPerCarton !== 1 ? "s" : ""} ={" "}
                  {totalItems.toLocaleString("en-PK")} pieces
                </p>

                <div>
                  <label className={labelCls()}>Expected Arrival Date</label>
                  <div className="relative">
                    <CalendarDays size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#84cc16]/60 pointer-events-none" />
                    <input
                      type="date"
                      value={expectedDate}
                      onChange={(e) => setExpectedDate(e.target.value)}
                      min={new Date().toISOString().split("T")[0]}
                      className={`${inputCls()} pl-10 [color-scheme:dark]`}
                    />
                  </div>
                </div>

                {formError && (
                  <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-2.5">
                    <AlertCircle size={14} className="text-red-400 shrink-0 mt-0.5" />
                    <p className="text-xs text-red-400 font-body">{formError}</p>
                  </div>
                )}

                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={openConfirm}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-[#1a231d] text-[#84cc16] border border-[#84cc16]/40 rounded-full text-sm font-body font-semibold hover:bg-[#222e26] hover:border-[#84cc16]/60 hover:shadow-lg hover:shadow-[#84cc16]/10 active:scale-95 transition-all duration-200 shadow-sm"
                  >
                    <Send size={16} /> Continue
                  </button>
                  <button
                    onClick={onClose}
                    className="px-5 py-3 border border-neutral-800 text-neutral-400 rounded-full text-sm font-body hover:bg-white/5 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              /* ─── CONFIRMATION STEP ─── */
              <div className="space-y-5">
                <div className="p-4 rounded-2xl bg-neutral-900/60 border border-neutral-800">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#84cc16]/10 border border-[#84cc16]/30 flex items-center justify-center shrink-0">
                      <Package size={17} className="text-[#84cc16]" />
                    </div>
                    <p className="text-sm text-white font-body leading-relaxed">
                      Confirm adding{" "}
                      <span className="font-bold text-[#84cc16]">{totalCartons}</span>{" "}
                      carton{totalCartons !== 1 ? "s" : ""} containing{" "}
                      <span className="font-bold text-[#84cc16]">
                        {totalItems.toLocaleString("en-PK")}
                      </span>{" "}
                      piece{totalItems !== 1 ? "s" : ""} of{" "}
                      <span className="font-semibold text-white">{itemName.trim()}</span>{" "}
                      to <span className="font-semibold text-white">{warehouseName}</span>?
                    </p>
                  </div>
                </div>

                {/* Summary rows */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-body">
                    <span className="text-neutral-400">Item</span>
                    <span className="text-white font-medium">{itemName.trim()}</span>
                  </div>
                  {sku.trim() && (
                    <div className="flex items-center justify-between text-xs font-body">
                      <span className="text-neutral-400">SKU</span>
                      <span className="text-white font-mono">{sku.trim()}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-xs font-body">
                    <span className="text-neutral-400">Cartons</span>
                    <span className="text-white font-medium numeric">{totalCartons}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-body">
                    <span className="text-neutral-400">Pieces / Carton</span>
                    <span className="text-white font-medium numeric">{itemsPerCarton}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-body">
                    <span className="text-neutral-400">Total Pieces</span>
                    <span className="text-[#84cc16] font-bold numeric">
                      {totalItems.toLocaleString("en-PK")}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-body">
                    <span className="text-neutral-400">Expected Arrival</span>
                    <span className="text-white font-medium">
                      {new Date(expectedDate).toLocaleDateString("en-PK", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-body">
                    <span className="text-neutral-400">Destination</span>
                    <span className="flex items-center gap-1 text-white font-medium truncate max-w-[60%]">
                      <Warehouse size={12} className="text-[#84cc16] shrink-0" />
                      <span className="truncate">{warehouseName}</span>
                    </span>
                  </div>
                </div>

                {submitError && (
                  <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-2.5">
                    <AlertCircle size={14} className="text-red-400 shrink-0 mt-0.5" />
                    <p className="text-xs text-red-400 font-body">{submitError}</p>
                  </div>
                )}

                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#1a231d] text-[#84cc16] border border-[#84cc16]/40 rounded-full text-sm font-body font-semibold hover:bg-[#222e26] hover:border-[#84cc16]/60 hover:shadow-lg hover:shadow-[#84cc16]/10 active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? (
                      <>
                        <Loader2 size={16} className="animate-spin" /> Creating...
                      </>
                    ) : (
                      <>
                        <CheckCircle size={16} /> Confirm & Create
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => setStep("form")}
                    disabled={submitting}
                    className="px-5 py-3 border border-neutral-800 text-neutral-400 rounded-full text-sm font-body hover:bg-white/5 transition-colors disabled:opacity-50"
                  >
                    Back
                  </button>
                </div>

                <p className="flex items-center gap-1.5 text-[11px] text-neutral-500 font-body">
                  <Sparkles size={11} className="text-[#84cc16]/70" />
                  The warehouse owner will be notified as soon as this shipment is created.
                </p>
              </div>
            )}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
