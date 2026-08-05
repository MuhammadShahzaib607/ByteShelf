"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { X, CheckCircle2, Loader2, AlertCircle, FileText } from "lucide-react";
import api from "@/lib/axios";

// ─── Types ──────────────────────────────────────────────────────────────────────

interface DeliveryConfirmationModalProps {
  order: {
    _id: string;
    orderId: string;
    customerDetails?: { name?: string } | null;
  };
  onClose: () => void;
  onDelivered: () => void;
}

// ─── Component ──────────────────────────────────────────────────────────────────

export default function DeliveryConfirmationModal({
  order,
  onClose,
  onDelivered,
}: DeliveryConfirmationModalProps) {
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleConfirm = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await api.patch(`/order/${order._id}/mark-delivered`, {
        note: note.trim(),
      });
      onDelivered();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to mark the order as delivered.");
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
        className="w-full max-w-md bg-[#111614] rounded-3xl shadow-2xl border border-neutral-800 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 pb-0">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shrink-0">
                <CheckCircle2 size={18} className="text-emerald-400" />
              </div>
              <div>
                <h3 className="font-heading text-lg font-semibold text-white">Confirm Delivery</h3>
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
        <form
          className="p-6 space-y-4"
          onSubmit={(e) => { e.preventDefault(); handleConfirm(); }}
        >
          <p className="text-sm text-neutral-300 font-body leading-relaxed">
            Marking this order as <span className="text-emerald-400 font-semibold">Delivered</span> will finalize the
            delivery cycle and notify the other party.
          </p>

          {/* Delivery Note / Received By (optional) */}
          <div>
            <label className="text-[10px] font-semibold tracking-wider text-neutral-400 uppercase mb-1.5 block font-body">
              Delivery Note / Received By <span className="normal-case text-neutral-600">(Optional)</span>
            </label>
            <div className="relative">
              <FileText size={14} className="absolute left-4 top-3.5 text-neutral-500 pointer-events-none" />
              <textarea
                value={note}
                onChange={(e) => { setNote(e.target.value); clearError(); }}
                placeholder="e.g. Received by Customer - Confirmed via Rider"
                rows={3}
                autoFocus
                className="w-full pl-10 pr-4 py-3 bg-neutral-900/80 border border-neutral-800 rounded-xl text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:border-[#84cc16] focus:bg-neutral-900 transition-all font-body resize-none"
              />
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-2.5">
              <AlertCircle size={14} className="text-red-400 shrink-0 mt-0.5" />
              <p className="text-xs text-red-400 font-body">{error}</p>
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 px-5 py-3 border border-neutral-800 text-neutral-300 rounded-full text-sm font-body font-medium hover:bg-white/5 hover:text-white transition-all">
              Cancel
            </button>
            <button type="submit" disabled={submitting}
              className="flex-[1.4] inline-flex items-center justify-center gap-2 px-5 py-3 bg-emerald-500/10 text-emerald-400 border border-emerald-500/40 rounded-full text-sm font-body font-semibold hover:bg-emerald-500/20 hover:border-emerald-500/60 hover:shadow-lg hover:shadow-emerald-500/10 active:scale-95 transition-all duration-200 disabled:opacity-60">
              {submitting ? <><Loader2 size={15} className="animate-spin" />Confirming...</> : <><CheckCircle2 size={15} />Confirm Delivery</>}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
