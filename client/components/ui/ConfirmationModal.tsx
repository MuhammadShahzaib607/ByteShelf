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
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isLoading) onCancel();
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-[#E2E8F0] overflow-hidden"
      >
        {/* Close button */}
        <button
          onClick={onCancel}
          disabled={isLoading}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[#F8FAFC]/60 flex items-center justify-center text-[#0F172A]/50 hover:bg-[#F8FAFC] transition-colors z-10"
        >
          <X size={16} />
        </button>

        <div className="p-6">
          {/* Icon */}
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4 ${
              accentColor === "red"
                ? "bg-red-50"
                : accentColor === "amber"
                ? "bg-amber-50"
                : "bg-[#0284C7]/10"
            }`}
          >
            <AlertTriangle
              size={24}
              className={
                accentColor === "red"
                  ? "text-red-500"
                  : accentColor === "amber"
                  ? "text-[#F59E0B]"
                  : "text-[#0284C7]"
              }
            />
          </div>

          {/* Title */}
          <h3 className="font-heading text-lg font-semibold text-[#1E293B] text-center mb-2">
            {title}
          </h3>

          {/* Message */}
          <p className="text-sm text-[#0F172A]/60 font-body text-center leading-relaxed">
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
                className="w-full px-4 py-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[#0F172A] placeholder:text-[#0F172A]/30 focus:outline-none focus:border-[#0284C7] focus:bg-white transition-all text-sm font-body resize-none"
              />
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-6 flex items-center gap-3">
            <button
              onClick={onCancel}
              disabled={isLoading}
              className="flex-1 px-5 py-3 border-2 border-[#E2E8F0] text-[#1E293B] rounded-full font-body text-sm font-medium hover:bg-[#F8FAFC]/60 transition-all duration-200 disabled:opacity-50"
            >
              {cancelLabel}
            </button>
            <button
              onClick={() => onConfirm(showReasonInput ? reason : undefined)}
              disabled={isLoading}
              className={`flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full font-body text-sm font-medium transition-all duration-200 shadow-sm disabled:opacity-50 ${
                accentColor === "red"
                  ? "bg-red-600 text-white hover:bg-red-700"
                  : accentColor === "amber"
                  ? "bg-[#F59E0B] text-white hover:bg-[#F59E0B]/90"
                  : "bg-[#0284C7] text-white hover:bg-[#0284C7]/90"
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
