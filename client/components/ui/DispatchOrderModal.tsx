"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { X, Truck, Loader2, AlertCircle, User, Hash } from "lucide-react";
import api from "@/lib/axios";

// ─── Types ──────────────────────────────────────────────────────────────────────

interface DispatchOrderModalProps {
  order: {
    _id: string;
    orderId: string;
    customerDetails?: { name?: string } | null;
    orderedItems?: Array<{ itemName?: string; quantity?: number }> | null;
  };
  onClose: () => void;
  onDispatched: () => void;
}

// ─── Component ──────────────────────────────────────────────────────────────────

export default function DispatchOrderModal({
  order,
  onClose,
  onDispatched,
}: DispatchOrderModalProps) {
  const [riderName, setRiderName] = useState("");
  const [trackingId, setTrackingId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const totalPieces =
    (order.orderedItems || []).reduce((s, it) => s + (it.quantity || 0), 0);

  const handleSubmit = async () => {
    if (!riderName.trim()) {
      setError("Please enter the Rider / Courier name.");
      return;
    }
    if (!trackingId.trim()) {
      setError("Please enter the Tracking ID / Phone Number.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await api.patch(`/order/${order._id}/dispatch`, {
        courierName: riderName.trim(),
        trackingId: trackingId.trim(),
      });
      onDispatched();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to dispatch the order.");
    } finally {
      setSubmitting(false);
    }
  };

  const clearError = () => { if (error) setError(null); };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="w-full max-w-md bg-[#111614] rounded-3xl shadow-2xl border border-neutral-800/80 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 pb-0">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#1a231d] border border-[#84cc16]/40 flex items-center justify-center shrink-0">
                <Truck size={18} className="text-[#84cc16]" />
              </div>
              <div>
                <h3 className="font-heading text-lg font-semibold text-white">Dispatch Order</h3>
                <p className="text-xs text-neutral-400 font-body mt-0.5">
                  <span className="font-mono text-[#84cc16]">{order.orderId}</span>
                  {order.customerDetails?.name ? ` · ${order.customerDetails.name}` : ""}
                </p>
              </div>
            </div>
            <button onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-neutral-400 hover:text-white hover:bg-white/20 transition-all shrink-0">
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Form */}
        <form className="p-6 space-y-4" onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
          {/* Rider / Courier Name */}
          <div>
            <label className="text-[10px] font-semibold tracking-wider text-neutral-400 uppercase mb-1.5 block font-body">
              Rider / Courier Name
            </label>
            <div className="relative">
              <User size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none" />
              <input
                type="text"
                value={riderName}
                onChange={(e) => { setRiderName(e.target.value); clearError(); }}
                placeholder="e.g. In-House Rider, Bykea, TCS"
                autoFocus
                className="w-full pl-10 pr-4 py-3 bg-neutral-900/80 border border-neutral-800 rounded-xl text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:border-[#84cc16] focus:bg-neutral-900 transition-all font-body"
              />
            </div>
          </div>

          {/* Tracking ID / Phone Number */}
          <div>
            <label className="text-[10px] font-semibold tracking-wider text-neutral-400 uppercase mb-1.5 block font-body">
              Tracking ID / Phone Number
            </label>
            <div className="relative">
              <Hash size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none" />
              <input
                type="text"
                value={trackingId}
                onChange={(e) => { setTrackingId(e.target.value); clearError(); }}
                placeholder="e.g. 0300-1234567 or TRK-992"
                className="w-full pl-10 pr-4 py-3 bg-neutral-900/80 border border-neutral-800 rounded-xl text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:border-[#84cc16] focus:bg-neutral-900 transition-all font-body"
              />
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-2.5">
              <AlertCircle size={14} className="text-red-400 shrink-0 mt-0.5" />
              <p className="text-xs text-red-400 font-body">{error}</p>
            </div>
          )}

          {/* Summary */}
          <div className="p-3.5 rounded-2xl bg-neutral-900/60 border border-neutral-800 flex items-center justify-between">
            <span className="text-xs text-neutral-400 font-body">Items</span>
            <span className="text-sm font-semibold text-white font-body">
              {totalPieces} piece{totalPieces !== 1 ? "s" : ""}
            </span>
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 px-5 py-3 border border-neutral-800 text-neutral-300 rounded-full text-sm font-body font-medium hover:bg-white/5 hover:text-white transition-all">
              Cancel
            </button>
            <button type="submit" disabled={submitting}
              className="flex-[1.4] inline-flex items-center justify-center gap-2 px-5 py-3 bg-[#1a231d] text-[#84cc16] border border-[#84cc16]/40 rounded-full text-sm font-body font-semibold hover:bg-[#222e26] hover:border-[#84cc16]/60 hover:shadow-lg hover:shadow-[#84cc16]/10 active:scale-95 transition-all duration-200 disabled:opacity-60">
              {submitting ? <><Loader2 size={15} className="animate-spin" />Dispatching...</> : <><Truck size={15} />Dispatch Order</>}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
