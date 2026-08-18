"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Store,
  MapPin,
  Layers,
  CalendarDays,
  Clock,
  AlertCircle,
  Upload,
  Package,
  CheckCircle,
  XCircle,
} from "lucide-react";
import UploadPaymentProofModal from "@/components/ui/UploadPaymentProofModal";
import { payoutHasAnyData, type PayoutDetailsData } from "@/components/ui/PayoutDetailsForm";

// ─── Types ──────────────────────────────────────────────────────────────────────

export interface MerchantBooking {
  _id: string;
  warehouse?: {
    _id: string;
    name: string;
    location: string;
    payoutDetails?: PayoutDetailsData;
  };
  warehouseName?: string;
  warehouseLocation?: string;
  shelfIds?: string[];
  shelves?: Array<{ _id: string; shelfNumber: string }>;
  startDate: string;
  endDate: string;
  status: string;
  paymentStatus: string;
  paymentAttemptsCount?: number;
  totalAmount: number;
  cancellationReason?: string;
  paymentRejectionReason?: string;
  pricePerShelf?: number;
  createdAt: string;
}

interface MerchantBookingDetailsModalProps {
  booking: MerchantBooking;
  onClose: () => void;
  onUploaded?: () => void;
  onViewInbound?: (booking: MerchantBooking) => void;
}

// ─── Helpers ────────────────────────────────────────────────────────────────────

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-PK", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function calcMonths(start: Date, end: Date): number {
  return Math.max(
    1,
    Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30.44))
  );
}

// Distinct badge for the BOOKING status (prefix + color-coded).
function bookingBadge(status: string) {
  const c: Record<string, { bg: string; text: string; icon: ReactNode; label: string }> = {
    confirmed: { bg: "bg-emerald-500/10 border-emerald-500/20", text: "text-emerald-400", icon: <CheckCircle size={11} />, label: "Booking: Confirmed" },
    cancelled: { bg: "bg-red-500/10 border-red-500/20", text: "text-red-400", icon: <XCircle size={11} />, label: "Booking: Cancelled" },
    rejected: { bg: "bg-red-500/10 border-red-500/20", text: "text-red-400", icon: <XCircle size={11} />, label: "Booking: Rejected" },
    completed: { bg: "bg-neutral-500/10 border-neutral-500/20", text: "text-neutral-400", icon: <CheckCircle size={11} />, label: "Booking: Completed" },
    pending: { bg: "bg-amber-500/10 border-amber-500/20", text: "text-amber-400", icon: <Clock size={11} />, label: "Booking: Pending" },
  };
  const s = c[status] || c.pending;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider border ${s.bg} ${s.text}`}>
      {s.icon}
      {s.label}
    </span>
  );
}

// Distinct badge for the PAYMENT status (prefix + color-coded).
function paymentBadge(status: string) {
  const c: Record<string, { bg: string; text: string; icon: ReactNode; label: string }> = {
    paid: { bg: "bg-emerald-500/10 border-emerald-500/20", text: "text-emerald-400", icon: <CheckCircle size={11} />, label: "Payment: Paid" },
    payment_rejected: { bg: "bg-red-500/10 border-red-500/20", text: "text-red-400", icon: <XCircle size={11} />, label: "Payment: Rejected" },
    payment_submitted: { bg: "bg-sky-500/10 border-sky-500/20", text: "text-sky-400", icon: <Clock size={11} />, label: "Payment: Under Review" },
    unpaid: { bg: "bg-neutral-500/10 border-neutral-500/20", text: "text-neutral-400", icon: <Clock size={11} />, label: "Payment: Unpaid" },
    pending: { bg: "bg-neutral-500/10 border-neutral-500/20", text: "text-neutral-400", icon: <Clock size={11} />, label: "Payment: Unpaid" },
  };
  const s = c[status] || c.unpaid;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider border ${s.bg} ${s.text}`}>
      {s.icon}
      {s.label}
    </span>
  );
}

// ─── Component ──────────────────────────────────────────────────────────────────

const MAX_ATTEMPTS = 2;

export default function MerchantBookingDetailsModal({
  booking,
  onClose,
  onUploaded,
  onViewInbound,
}: MerchantBookingDetailsModalProps) {
  const [showUploadProof, setShowUploadProof] = useState(false);
  // Local state so the modal reflects a successful upload instantly
  // (attempt count + payment status) without waiting for a refetch.
  const [localPaymentStatus, setLocalPaymentStatus] = useState(booking.paymentStatus);
  const [localAttempts, setLocalAttempts] = useState(booking.paymentAttemptsCount || 0);
  const b = booking;

  const start = new Date(b.startDate);
  const end = new Date(b.endDate);
  const months = start < end ? calcMonths(start, end) : 1;
  const shelfCount = b.shelves?.length || b.shelfIds?.length || 0;
  const bookingConfirmed = b.status === "confirmed";
  const attempts = localAttempts;
  // Show the (re-)upload button whenever attempts remain AND payment is not
  // already PAID — including during attempt 2 (attempts === 1).
  const canUploadProof =
    bookingConfirmed && attempts < MAX_ATTEMPTS && localPaymentStatus !== "paid";
  const canAddInbound = b.status === "confirmed" && localPaymentStatus === "paid";

  const handleUploaded = () => {
    setShowUploadProof(false);
    setLocalPaymentStatus("payment_submitted");
    setLocalAttempts((a) => a + 1);
    onUploaded?.();
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-16 sm:pt-20 bg-black/80 backdrop-blur-md overflow-y-auto"
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="w-full max-w-lg bg-[#0e130e] rounded-3xl shadow-2xl border border-[#1f291f] overflow-hidden relative"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={onClose}
            className="absolute top-5 right-5 w-8 h-8 rounded-full bg-[#121612] border border-[#1f291f] flex items-center justify-center text-neutral-400 hover:bg-[#1a221a] hover:text-white transition-all z-10"
            aria-label="Close details"
          >
            <X size={16} />
          </button>

          <div className="p-6 sm:p-8">
            {/* Header: Warehouse + Status */}
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-2xl bg-[#84cc16] flex items-center justify-center shrink-0">
                <Store size={20} className="text-black" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="font-heading text-lg font-semibold text-white truncate">
                  {b.warehouseName || b.warehouse?.name || "Warehouse"}
                </h2>
                <p className="text-xs text-neutral-400 font-body flex items-center gap-1">
                  <MapPin size={11} className="shrink-0" />
                  <span className="truncate">
                    {b.warehouseLocation || b.warehouse?.location || ""}
                  </span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              {bookingBadge(b.status)}
              {paymentBadge(localPaymentStatus)}
            </div>

            {/* Rejection / Cancellation reason */}
            {(b.status === "rejected" || b.status === "cancelled") && b.cancellationReason && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                <p className="text-[10px] font-semibold tracking-wider text-red-400 uppercase font-body mb-1">
                  {b.status === "rejected" ? "Reason for Rejection" : "Reason for Cancellation"}
                </p>
                <p className="text-xs text-neutral-200 font-body leading-relaxed">{b.cancellationReason}</p>
              </div>
            )}

            {/* Duration + Shelf count */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="p-3 rounded-xl bg-[#121612] border border-[#1f291f]">
                <p className="text-[10px] font-semibold tracking-wider text-neutral-400 uppercase mb-1 font-body">Booking Duration</p>
                <p className="text-sm font-semibold text-white font-body flex items-center gap-1.5">
                  <CalendarDays size={13} className="text-[#84cc16] shrink-0" />
                  {formatDate(b.startDate)} – {formatDate(b.endDate)}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-[#121612] border border-[#1f291f]">
                <p className="text-[10px] font-semibold tracking-wider text-neutral-400 uppercase mb-1 font-body">Total Shelves</p>
                <p className="text-sm font-semibold text-white font-body flex items-center gap-1.5">
                  <Layers size={13} className="text-[#84cc16] shrink-0" />
                  {shelfCount} shelf{shelfCount !== 1 ? "s" : ""} · {months} {months === 1 ? "month" : "months"}
                </p>
              </div>
            </div>

            {/* Financial summary */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-neutral-800/80 to-neutral-900/80 border border-neutral-800 flex items-center justify-between">
              <span className="text-sm font-medium text-white font-body">Total Amount</span>
              <span className="font-heading text-xl font-bold text-white numeric">
                Rs. {(b.totalAmount || 0).toLocaleString("en-PK")}
              </span>
            </div>

            {/* Payment section */}
            {localPaymentStatus !== "paid" && (
              <div className="mt-4 p-4 rounded-2xl bg-[#121612]/80 border border-[#1f291f]">
                {localPaymentStatus === "payment_submitted" && (
                  <div className="mb-3 flex items-start gap-2 p-3 rounded-xl bg-sky-500/10 border border-sky-500/20">
                    <Clock size={13} className="text-sky-400 shrink-0 mt-0.5" />
                    <p className="text-[11px] text-sky-300 font-body leading-snug">
                      <span className="font-semibold">Payment Under Verification by Owner.</span>{" "}
                      Your payment screenshot is being reviewed — inbound creation unlocks once it&apos;s confirmed.
                    </p>
                  </div>
                )}
                {localPaymentStatus === "payment_rejected" && (
                  <div className="mb-3 flex items-start gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                    <AlertCircle size={13} className="text-red-400 shrink-0 mt-0.5" />
                    <p className="text-[11px] text-red-300 font-body leading-snug">
                      Payment rejected: {b.paymentRejectionReason || "Please upload a new proof."}
                    </p>
                  </div>
                )}
                {payoutHasAnyData(b.warehouse?.payoutDetails) && (
                  <div className="mb-3">
                    <p className="text-[10px] font-semibold tracking-wider text-neutral-400 uppercase mb-2 font-body">
                      Pay to the warehouse owner
                    </p>
                    {(() => {
                      const pd = b.warehouse?.payoutDetails || ({} as PayoutDetailsData);
                      const bank = pd.bankDetails || {};
                      const wallet = pd.walletDetails || {};
                      const rows: { label: string; value: string }[] = [];
                      if (pd.payoutType === "bank_account" || pd.payoutType === "both") {
                        if (bank.accountTitle) rows.push({ label: "Account Title", value: bank.accountTitle });
                        if (bank.bankName) rows.push({ label: "Bank Name", value: bank.bankName });
                        if (bank.accountNumber) rows.push({ label: "Account Number", value: bank.accountNumber });
                        if (bank.iban) rows.push({ label: "IBAN", value: bank.iban });
                      }
                      if (pd.payoutType === "mobile_wallet" || pd.payoutType === "both") {
                        if (wallet.easyPaisaNumber) rows.push({ label: "EasyPaisa", value: wallet.easyPaisaTitle ? `${wallet.easyPaisaTitle} · ${wallet.easyPaisaNumber}` : wallet.easyPaisaNumber });
                        if (wallet.jazzCashNumber) rows.push({ label: "JazzCash", value: wallet.jazzCashTitle ? `${wallet.jazzCashTitle} · ${wallet.jazzCashNumber}` : wallet.jazzCashNumber });
                        if (wallet.sadaPayTagOrNumber) rows.push({ label: "SadaPay", value: wallet.sadaPayTagOrNumber });
                        if (wallet.nayaPayTagOrNumber) rows.push({ label: "NayaPay", value: wallet.nayaPayTagOrNumber });
                      }
                      return rows.length > 0 ? (
                        <div className="space-y-1.5">
                          {rows.map((r) => (
                            <div key={r.label} className="flex items-center justify-between gap-3 text-xs font-body">
                              <span className="text-neutral-400">{r.label}</span>
                              <span className="font-semibold text-white text-right break-all">{r.value}</span>
                            </div>
                          ))}
                        </div>
                      ) : null;
                    })()}
                  </div>
                )}
                {/* Booking not confirmed yet → payment locked */}
                {!bookingConfirmed && (
                  <div className="mb-3 flex items-start gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                    <Clock size={13} className="text-amber-400 shrink-0 mt-0.5" />
                    <p className="text-[11px] text-amber-200 font-body leading-snug">
                      ⏳ Payment submission will unlock once the warehouse owner approves your booking request.
                    </p>
                  </div>
                )}

                {/* Attempt warning — 1 remaining */}
                {bookingConfirmed && attempts === 1 && (
                  <div className="mb-3 flex items-start gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                    <AlertCircle size={13} className="text-amber-400 shrink-0 mt-0.5" />
                    <p className="text-[11px] text-amber-200 font-body leading-snug">
                      ⚠️ 1 attempt remaining. Please ensure screenshot details are legible.
                    </p>
                  </div>
                )}

                {/* Max attempts reached → upload disabled */}
                {bookingConfirmed && attempts >= MAX_ATTEMPTS && (
                  <div className="mb-3 flex items-start gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                    <XCircle size={13} className="text-red-400 shrink-0 mt-0.5" />
                    <p className="text-[11px] text-red-300 font-body leading-snug">
                      ❌ Maximum payment submission attempts reached ({MAX_ATTEMPTS}/{MAX_ATTEMPTS}). Contact warehouse owner for manual verification.
                    </p>
                  </div>
                )}

                {canUploadProof && (
                  <button
                    onClick={() => setShowUploadProof(true)}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#1a231d] text-[#84cc16] border border-[#84cc16]/40 rounded-full text-xs font-body font-semibold hover:bg-[#222e26] hover:border-[#84cc16]/60 transition-all duration-200"
                  >
                    <Upload size={13} />
                    {attempts === 0
                      ? `Upload Payment Proof (1 of ${MAX_ATTEMPTS})`
                      : `Re-upload Payment Proof (Final Attempt ${attempts + 1} of ${MAX_ATTEMPTS})`}
                  </button>
                )}
              </div>
            )}

            {/* Add Inbound CTA */}
            {canAddInbound && (
              <button
                onClick={() => onViewInbound?.(b)}
                className="mt-4 w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-emerald-500 text-black rounded-full text-sm font-body font-semibold hover:bg-emerald-600 transition-all duration-200 shadow-sm active:scale-[0.98]"
              >
                <Package size={15} /> Add Inbound Shipment
              </button>
            )}

            {/* Booked shelves */}
            {b.shelves && b.shelves.length > 0 && (
              <div className="mt-4">
                <p className="text-[10px] font-semibold tracking-wider text-neutral-400 uppercase mb-2 font-body">Booked Shelves</p>
                <div className="flex flex-wrap gap-1.5">
                  {b.shelves.map((shelf) => (
                    <span key={shelf._id} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/5 border border-neutral-800 text-[11px] font-body">
                      <Layers size={11} className="text-[#84cc16]" />
                      <span className="font-medium text-white">{shelf.shelfNumber}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>

      {/* Upload Payment Proof */}
      <AnimatePresence>
        {showUploadProof && (
          <UploadPaymentProofModal
            booking={{
              _id: b._id,
              warehouseName: b.warehouseName || b.warehouse?.name,
              totalAmount: b.totalAmount,
            }}
            onClose={() => setShowUploadProof(false)}
            onUploaded={handleUploaded}
          />
        )}
      </AnimatePresence>
    </>
  );
}
