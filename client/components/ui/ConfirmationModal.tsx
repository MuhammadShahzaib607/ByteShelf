"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, X, Loader2 } from "lucide-react";

interface ConfirmationModalProps {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning" | "info";
  showReasonInput?: boolean;
  reasonPlaceholder?: string;
  // When true, the confirm action stays disabled until a non-empty reason is typed.
  requireReason?: boolean;
  isDestructive?: boolean;
  onConfirm: (reason?: string) => void | Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "danger",
  showReasonInput = false,
  reasonPlaceholder = "Reason (Optional)",
  requireReason = false,
  onConfirm,
  onCancel,
  isLoading = false,
}) => {
  const [reason, setReason] = useState("");

  const accentColor =
    variant === "danger"
      ? "red"
      : variant === "warning"
      ? "amber"
      : "blue";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isLoading) onCancel();
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="w-full max-w-md bg-[#0e130e] rounded-3xl shadow-2xl border border-[#1f291f] overflow-hidden"
      >
        {/* Close button */}
        <button
          onClick={onCancel}
          disabled={isLoading}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[#121612] border border-[#1f291f] flex items-center justify-center text-slate-400 hover:bg-[#1a221a] hover:text-white transition-colors z-10"
        >
          <X size={16} />
        </button>

        <div className="p-6">
          {/* Icon */}
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4 ${
              accentColor === "red"
                ? "bg-red-500/10"
                : accentColor === "amber"
                ? "bg-amber-500/10"
                : "bg-emerald-500/10"
            }`}
          >
            <AlertTriangle
              size={24}
              className={
                accentColor === "red"
                  ? "text-red-500"
                  : accentColor === "amber"
                  ? "text-amber-400"
                  : "text-emerald-400"
              }
            />
          </div>

          {/* Title */}
          <h3 className="font-heading text-lg font-semibold text-white text-center mb-2">
            {title}
          </h3>

          {/* Message */}
          <p className="text-sm text-slate-300 font-body text-center leading-relaxed">
            {message}
          </p>

          {/* Reason Input */}
          {showReasonInput && (
            <div className="mt-5">
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={reasonPlaceholder}
                rows={3}
                disabled={isLoading}
                className="w-full px-4 py-3 bg-[#121612] border border-[#1f291f] rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-all text-sm font-body resize-none"
              />
              {requireReason && !reason.trim() && (
                <p className="mt-1.5 text-xs text-red-600 font-body">
                  Please provide a reason to continue.
                </p>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-6 flex items-center gap-3">
            <button
              onClick={onCancel}
              disabled={isLoading}
              className="flex-1 px-5 py-3 border border-[#1f291f] text-slate-300 rounded-full font-body text-sm font-medium hover:bg-white/5 hover:border-[#2a352a] transition-all duration-200 disabled:opacity-50"
            >
              {cancelLabel}
            </button>
            <button
              onClick={() => onConfirm(showReasonInput ? reason : undefined)}
              disabled={isLoading || (requireReason && !reason.trim())}
              className={`flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full font-body text-sm font-medium transition-all duration-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed ${
                accentColor === "red"
                  ? "bg-red-600 text-white hover:bg-red-700"
                  : accentColor === "amber"
                  ? "bg-amber-500 text-white hover:bg-amber-600"
                  : "bg-emerald-500 text-black hover:bg-emerald-600"
              }`}
            >
              {isLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Processing...
                </>
              ) : (
                confirmLabel
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ConfirmationModal;
