"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Layers,
  Plus,
  Loader2,
  X,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  ChevronLeft,
} from "lucide-react";
import api from "@/lib/axios";

// ─── Types ──────────────────────────────────────────────────────────────────────

interface AddShelvesModalProps {
  warehouseId: string;
  warehouseName: string;
  pricePerShelf: number;
  totalShelves: number;
  onClose: () => void;
  onSuccess: () => void;
}

// ═══════════════════════════════════════════════════════════════════════════════
// ADD SHELVES MODAL
// ═══════════════════════════════════════════════════════════════════════════════

const AddShelvesModal: React.FC<AddShelvesModalProps> = ({
  warehouseId,
  warehouseName,
  pricePerShelf,
  totalShelves,
  onClose,
  onSuccess,
}) => {
  const [step, setStep] = useState<"input" | "confirm">("input");
  const [numberOfShelves, setNumberOfShelves] = useState<number>(5);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const estimatedCost = numberOfShelves * pricePerShelf;
  const newTotal = totalShelves + numberOfShelves;

  // ─── Handle confirm ──────────────────────────────────────────────────────
  const handleConfirm = async () => {
    setIsSubmitting(true);
    setApiError(null);
    try {
      await api.post(`/shelf/add/${warehouseId}`, { numberOfShelves });
      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (err: any) {
      setApiError(
        err.response?.data?.message || "Failed to add shelves."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose();
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-[#0284C7]/15 overflow-hidden"
      >
        {/* Close button */}
        <button
          onClick={onClose}
          disabled={isSubmitting}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[#F8FAFC]/60 flex items-center justify-center text-[#0F172A]/50 hover:bg-[#F8FAFC] transition-colors z-10"
        >
          <X size={16} />
        </button>

        {/* Header */}
        <div className="p-6 pb-4 border-b border-[#0284C7]/10">
          <div className="flex items-center gap-3">
            {step === "confirm" && (
              <button
                onClick={() => setStep("input")}
                className="p-1 rounded-full hover:bg-[#F8FAFC]/40 transition-colors"
              >
                <ChevronLeft size={18} className="text-[#0F172A]/50" />
              </button>
            )}
            <div className="w-10 h-10 rounded-xl bg-[#F8FAFC] flex items-center justify-center">
              <Layers size={20} className="text-[#0284C7]" />
            </div>
            <div>
              <h2 className="font-heading text-lg font-semibold text-[#1E293B]">
                {success
                  ? "Shelves Added!"
                  : "Add Shelves"}
              </h2>
              <p className="text-xs text-[#0F172A]/50 font-body truncate max-w-[200px]">
                {warehouseName}
              </p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Success state */}
          {success ? (
            <div className="text-center py-6">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={28} className="text-emerald-500" />
              </div>
              <h3 className="font-heading text-lg font-semibold text-[#1E293B] mb-1">
                Successfully Added!
              </h3>
              <p className="text-sm text-[#0F172A]/50 font-body">
                {numberOfShelves} new shelves have been created.
              </p>
            </div>
          ) : step === "input" ? (
            <>
              {/* Step 1: Input */}
              <div>
                <label className="text-xs font-semibold tracking-wider text-[#1E293B] uppercase mb-2 block font-body">
                  Number of Shelves
                </label>
                <div className="relative">
                  <Layers
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-[#0284C7]/60 pointer-events-none"
                  />
                  <input
                    type="number"
                    min={1}
                    value={numberOfShelves}
                    onChange={(e) =>
                      setNumberOfShelves(
                        Math.max(1, parseInt(e.target.value) || 1)
                      )
                    }
                    className="w-full pl-11 pr-4 py-3.5 bg-[#F8FAFC]/40 border border-[#0284C7]/20 rounded-xl text-[#0F172A] placeholder:text-[#0F172A]/30 focus:outline-none focus:border-[#0284C7] focus:bg-white transition-all text-sm font-mono tabular-nums font-body"
                  />
                </div>
              </div>

              {/* Live preview */}
              <div className="p-4 rounded-2xl bg-[#F8FAFC]/30 border border-[#0284C7]/10 space-y-2">
                <div className="flex items-center justify-between text-sm font-body">
                  <span className="text-[#0F172A]/60">Price per shelf</span>
                  <span className="font-mono tabular-nums font-medium text-[#1E293B]">
                    ₹{pricePerShelf.toLocaleString()}/mo
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm font-body">
                  <span className="text-[#0F172A]/60">Shelves to add</span>
                  <span className="font-mono tabular-nums font-medium text-[#1E293B]">
                    × {numberOfShelves}
                  </span>
                </div>
                <hr className="border-[#0284C7]/10" />
                <div className="flex items-center justify-between text-sm font-body">
                  <span className="text-[#0F172A]/70 font-medium">
                    Estimated monthly increase
                  </span>
                  <span className="font-mono tabular-nums font-bold text-[#1E293B]">
                    ₹{estimatedCost.toLocaleString()}/mo
                  </span>
                </div>
                <p className="text-[11px] text-[#0F172A]/40 font-body mt-1">
                  This will append {numberOfShelves} new shelf
                  {numberOfShelves !== 1 ? "ves" : ""} at ₹
                  {pricePerShelf.toLocaleString()}/month each.
                </p>
              </div>

              {/* Continue button */}
              <button
                onClick={() => setStep("confirm")}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 bg-[#1E293B] text-white rounded-full font-body text-sm font-medium hover:bg-[#0284C7] transition-all duration-300 shadow-sm active:scale-[0.98]"
              >
                Continue
                <ArrowRight size={16} />
              </button>
            </>
          ) : (
            <>
              {/* Step 2: Confirmation */}
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200">
                  <div className="flex items-start gap-3">
                    <AlertCircle size={18} className="text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-amber-800 font-body">
                        Please confirm
                      </p>
                      <p className="text-xs text-amber-700/70 font-body mt-1">
                        This action will create new shelves and cannot be
                        undone.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Summary */}
                <div className="space-y-3 bg-[#F8FAFC]/40 rounded-2xl p-4 border border-[#0284C7]/10">
                  <div className="flex items-center justify-between text-sm font-body">
                    <span className="text-[#0F172A]/60">Warehouse</span>
                    <span className="font-medium text-[#1E293B] truncate ml-4">
                      {warehouseName}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm font-body">
                    <span className="text-[#0F172A]/60">New shelves</span>
                    <span className="font-mono tabular-nums font-semibold text-[#1E293B]">
                      +{numberOfShelves}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm font-body">
                    <span className="text-[#0F172A]/60">Total after adding</span>
                    <span className="font-mono tabular-nums font-semibold text-[#1E293B]">
                      {newTotal} shelves
                    </span>
                  </div>
                  <hr className="border-[#0284C7]/10" />
                  <div className="flex items-center justify-between text-sm font-body">
                    <span className="text-[#0F172A]/70 font-medium">
                      Monthly revenue increase
                    </span>
                    <span className="font-mono tabular-nums font-bold text-emerald-600">
                      +₹{estimatedCost.toLocaleString()}/mo
                    </span>
                  </div>
                </div>

                {/* API Error */}
                {apiError && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2.5">
                    <AlertCircle size={14} className="text-red-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-red-600 font-body">{apiError}</p>
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={onClose}
                    disabled={isSubmitting}
                    className="flex-1 px-5 py-3 border border-[#0284C7]/30 text-[#0284C7] rounded-full font-body text-sm font-medium hover:bg-[#F8FAFC]/40 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirm}
                    disabled={isSubmitting}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 bg-[#1E293B] text-white rounded-full font-body text-sm font-medium hover:bg-[#0284C7] transition-all duration-300 shadow-sm disabled:opacity-60 active:scale-[0.98]"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Adding...
                      </>
                    ) : (
                      <>
                        <CheckCircle size={16} />
                        Confirm & Add
                      </>
                    )}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default AddShelvesModal;
