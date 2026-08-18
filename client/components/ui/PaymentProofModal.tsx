"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  ImageIcon,
  Loader2,
  AlertCircle,
  CheckCircle,
  XCircle,
  Banknote,
} from "lucide-react";
import api from "@/lib/axios";
import ConfirmationModal from "@/components/ui/ConfirmationModal";

// ─── Types ──────────────────────────────────────────────────────────────────────

interface BookingRef {
  _id: string;
  merchant?: { _id: string; name?: string };
  warehouse?: { _id: string; name?: string };
  paymentProofUrl?: string;
  proofScreenshots?: string[];
  totalAmount?: number;
  status?: string;
  paymentStatus?: string;
  paymentRejectionReason?: string;
}

interface PaymentProofModalProps {
  booking: BookingRef;
  onClose: () => void;
  onUpdated?: (updated: BookingRef) => void;
}

// ─── Component (dark theme) ─────────────────────────────────────────────────────

export default function PaymentProofModal({
  booking,
  onClose,
  onUpdated,
}: PaymentProofModalProps) {
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showRejectConfirm, setShowRejectConfirm] = useState(false);
  const [zoomIndex, setZoomIndex] = useState<number | null>(null);

  const warehouseId = booking.warehouse?._id;

  // All submitted screenshots (attempt history). Falls back to the latest
  // single screenshot for older bookings that predate proofScreenshots.
  const screenshots = (booking.proofScreenshots && booking.proofScreenshots.length > 0
    ? booking.proofScreenshots
    : booking.paymentProofUrl
    ? [booking.paymentProofUrl]
    : []) as string[];

  const handleApprove = useCallback(async () => {
    if (!warehouseId) return;
    setActionLoading("approve");
    setError(null);
    try {
      await api.patch(`/booking/warehouse/${warehouseId}/verify-payment/${booking._id}`, {
        verified: true,
      });
      onUpdated?.({ ...booking, paymentStatus: "paid", status: "confirmed" });
      onClose();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setError(axiosErr.response?.data?.message || "Failed to verify payment.");
    } finally {
      setActionLoading(null);
    }
  }, [warehouseId, booking, onUpdated, onClose]);

  const handleReject = useCallback(
    async (reason?: string) => {
      if (!warehouseId) return;
      setActionLoading("reject");
      setError(null);
      setShowRejectConfirm(false);
      try {
        await api.patch(`/booking/warehouse/${warehouseId}/verify-payment/${booking._id}`, {
          verified: false,
          reason: reason || "",
        });
        onUpdated?.({
          ...booking,
          paymentStatus: "payment_rejected",
          paymentRejectionReason: (reason || "").trim(),
        });
        onClose();
      } catch (err: unknown) {
        const axiosErr = err as { response?: { data?: { message?: string } } };
        setError(axiosErr.response?.data?.message || "Failed to reject payment.");
      } finally {
        setActionLoading(null);
      }
    },
    [warehouseId, booking, onUpdated, onClose]
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[70] flex items-start justify-center p-4 pt-16 sm:pt-20 bg-black/80 backdrop-blur-md overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget && !actionLoading) onClose();
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="w-full max-w-lg bg-[#0e130e] rounded-3xl shadow-2xl border border-[#1f291f] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 sm:p-8">
          {/* Header */}
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-2xl bg-sky-500/10 border border-sky-500/25 flex items-center justify-center">
              <Banknote size={20} className="text-sky-400" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="font-heading text-lg font-semibold text-white">
                Verify Payment Proof
              </h2>
              <p className="text-xs text-slate-400 font-body truncate">
                {booking.merchant?.name || "Merchant"} · Rs.{" "}
                {(booking.totalAmount || 0).toLocaleString("en-PK")}
              </p>
            </div>
            <button
              onClick={onClose}
              disabled={!!actionLoading}
              className="w-8 h-8 rounded-full bg-[#121612] border border-[#1f291f] flex items-center justify-center text-slate-400 hover:bg-[#1a221a] hover:text-white transition-all disabled:opacity-50 shrink-0"
            >
              <X size={16} />
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-2.5">
              <AlertCircle size={14} className="text-red-400 shrink-0 mt-0.5" />
              <p className="text-xs text-red-300 font-body">{error}</p>
            </div>
          )}

          {/* Proof screenshots — gallery of every submitted attempt */}
          {screenshots.length === 0 ? (
            <div className="rounded-2xl border border-[#1f291f] bg-[#080c08] overflow-hidden mb-5">
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <ImageIcon size={32} className="text-slate-500 mb-3" />
                <p className="text-sm text-slate-400 font-body">
                  No proof image available
                </p>
              </div>
            </div>
          ) : screenshots.length === 1 ? (
            <button
              onClick={() => setZoomIndex(0)}
              className="rounded-2xl border border-[#1f291f] bg-[#080c08] overflow-hidden mb-5 w-full block group"
            >
              <img
                src={screenshots[0]}
                alt="Payment proof screenshot"
                className="w-full max-h-96 object-contain bg-[#080c08] group-hover:opacity-90 transition-opacity"
              />
            </button>
          ) : (
            <div className="mb-5">
              <p className="text-[10px] font-semibold tracking-wider text-neutral-400 uppercase mb-2 font-body">
                Submitted Proofs ({screenshots.length})
              </p>
              <div className="grid grid-cols-2 gap-3">
                {screenshots.map((src, i) => (
                  <button
                    key={`${src}-${i}`}
                    onClick={() => setZoomIndex(i)}
                    className="rounded-xl border border-[#1f291f] bg-[#080c08] overflow-hidden group text-left"
                  >
                    <img
                      src={src}
                      alt={`Payment proof attempt ${i + 1}`}
                      className="w-full h-36 object-cover group-hover:opacity-90 transition-opacity"
                    />
                    <span className="block px-2.5 py-1.5 text-[10px] font-semibold text-slate-400 font-body border-t border-[#1f291f]">
                      {i === 0 ? "Attempt 1 Proof" : `Attempt ${i + 1} Proof`}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Zoom / lightbox */}
          <AnimatePresence>
            {zoomIndex !== null && screenshots[zoomIndex] && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[90] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
                onClick={() => setZoomIndex(null)}
              >
                <motion.div
                  initial={{ scale: 0.92 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0.92 }}
                  className="relative max-w-4xl w-full"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => setZoomIndex(null)}
                    className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-[#121612] border border-[#1f291f] text-slate-300 hover:text-white flex items-center justify-center z-10"
                    aria-label="Close zoom"
                  >
                    <X size={15} />
                  </button>
                  <p className="text-center text-xs text-slate-400 font-body mb-2">
                    {zoomIndex === 0 ? "Attempt 1 Proof" : `Attempt ${zoomIndex + 1} Proof`}
                  </p>
                  <img
                    src={screenshots[zoomIndex]}
                    alt={`Payment proof attempt ${zoomIndex + 1}`}
                    className="w-full max-h-[80vh] object-contain rounded-xl"
                  />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          <p className="text-sm text-slate-300 font-body leading-relaxed mb-5">
            Review the merchant&apos;s transfer screenshot(s). Confirming marks the
            booking as paid and confirms it. Rejecting notifies the merchant with
            your reason so they can resubmit (they get up to 2 attempts).
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleApprove}
              disabled={actionLoading === "approve"}
              className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 bg-emerald-500 text-black rounded-full font-body text-sm font-semibold hover:bg-emerald-600 transition-all duration-200 shadow-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {actionLoading === "approve" ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <CheckCircle size={16} />
              )}
              Mark as Paid &amp; Confirm Booking
            </button>
            <button
              onClick={() => setShowRejectConfirm(true)}
              disabled={actionLoading === "reject"}
              className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 border border-red-900/50 text-red-400 rounded-full font-body text-sm font-medium hover:bg-red-950/40 active:scale-95 transition-all duration-200 disabled:opacity-50"
            >
              {actionLoading === "reject" ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <XCircle size={16} />
              )}
              Reject Payment
            </button>
          </div>
        </div>
      </motion.div>

      {/* Reject reason prompt */}
      <AnimatePresence>
        {showRejectConfirm && (
          <ConfirmationModal
            title="Reject Payment"
            message="Reject this payment proof? The merchant will be notified with your reason and can resubmit a new screenshot."
            confirmLabel="Confirm Rejection"
            cancelLabel="Cancel"
            variant="danger"
            showReasonInput
            reasonPlaceholder="Please state the reason for rejecting this payment (e.g. Screenshot unclear, Amount mismatch)"
            requireReason
            onConfirm={handleReject}
            onCancel={() => setShowRejectConfirm(false)}
            isLoading={actionLoading === "reject"}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
