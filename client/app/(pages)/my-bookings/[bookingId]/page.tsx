"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Warehouse,
  CalendarDays,
  Layers,
  MapPin,
  Loader2,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  CreditCard,
  Ban,
  Package,
  DollarSign,
  ChevronRight,
  MessageCircle,
  Upload,
} from "lucide-react";
import { useAppSelector } from "@/redux/hooks";
import api from "@/lib/axios";
import ConfirmationModal from "@/components/ui/ConfirmationModal";
import UploadPaymentProofModal from "@/components/ui/UploadPaymentProofModal";
import { payoutHasAnyData } from "@/components/ui/PayoutDetailsForm";

// ─── Types ──────────────────────────────────────────────────────────────────────

interface BookingDetail {
  _id: string;
  warehouse: {
    _id: string;
    name: string;
    location: string;
    owner?: string | { _id: string };
    payoutDetails?: any;
  };
  warehouseId?: string;
  owner?: string;
  shelves: Array<{ _id: string; shelfNumber: string }>;
  startDate: string;
  endDate: string;
  status: "confirmed" | "pending" | "rejected" | "cancelled";
  paymentStatus: "paid" | "pending" | "unpaid" | "payment_submitted" | "payment_rejected";
  paymentAttemptsCount?: number;
  totalAmount: number;
  pricePerShelf: number;
  cancellationReason?: string;
  paymentProofUrl?: string;
  paymentRejectionReason?: string;
  createdAt: string;
}

interface InboundPlan {
  _id: string;
  batchName: string;
  totalCartons: number;
  expectedDate: string;
  status: "in-transit" | "arrived" | "completed";
  createdAt: string;
  cartonStats?: Array<{ _id: string; count: number }>;
}

// ─── Status Badge ───────────────────────────────────────────────────────────────

function StatusBadge({
  status,
  type = "booking",
}: {
  status: string;
  type?: "booking" | "payment" | "inbound";
}) {
  const config: Record<string, { bg: string; text: string; icon: React.ReactNode; label: string }> = {
    confirmed: {
      bg: "bg-emerald-50 border-emerald-200",
      text: "text-emerald-700",
      icon: <CheckCircle size={12} />,
      label: "Confirmed",
    },
    pending: {
      bg: "bg-amber-50 border-amber-200",
      text: "text-amber-700",
      icon: <Clock size={12} />,
      label: "Pending",
    },
    cancelled: {
      bg: "bg-red-50 border-red-200",
      text: "text-red-700",
      icon: <XCircle size={12} />,
      label: "Cancelled",
    },
    rejected: {
      bg: "bg-red-50 border-red-200",
      text: "text-red-700",
      icon: <XCircle size={12} />,
      label: "Rejected",
    },
    paid: {
      bg: "bg-emerald-50 border-emerald-200",
      text: "text-emerald-700",
      icon: <CheckCircle size={12} />,
      label: "Paid",
    },
    unpaid: {
      bg: "bg-amber-50 border-amber-200",
      text: "text-amber-700",
      icon: <Clock size={12} />,
      label: "Unpaid",
    },
    payment_submitted: {
      bg: "bg-sky-50 border-sky-200",
      text: "text-sky-700",
      icon: <Clock size={12} />,
      label: "Verification Pending",
    },
    payment_rejected: {
      bg: "bg-red-50 border-red-200",
      text: "text-red-700",
      icon: <XCircle size={12} />,
      label: "Payment Rejected",
    },
    "in-transit": {
      bg: "bg-blue-50 border-blue-200",
      text: "text-blue-700",
      icon: <Clock size={12} />,
      label: "In Transit",
    },
    arrived: {
      bg: "bg-emerald-50 border-emerald-200",
      text: "text-emerald-700",
      icon: <CheckCircle size={12} />,
      label: "Arrived",
    },
    completed: {
      bg: "bg-slate-50 border-slate-200",
      text: "text-slate-700",
      icon: <CheckCircle size={12} />,
      label: "Completed",
    },
  };

  const c = config[status] || config.pending;
  // Prefix badges so booking vs payment statuses are never ambiguous.
  const prefix =
    type === "booking" ? "Booking: " : type === "payment" ? "Payment: " : "";

  return (
    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider border ${c.bg} ${c.text}`}>
      {c.icon}
      {prefix}
      {c.label}
    </span>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PAGE
// ═══════════════════════════════════════════════════════════════════════════════

export default function BookingDetailPage() {
  const router = useRouter();
  const params = useParams();
  const bookingId = params.bookingId as string;
  const { accessToken } = useAppSelector((state) => state.auth);

  // ─── Booking state ───────────────────────────────────────────────────────
  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // ─── Inbound plans state ─────────────────────────────────────────────────
  const [inboundPlans, setInboundPlans] = useState<InboundPlan[]>([]);
  const [plansLoading, setPlansLoading] = useState(true);

  // ─── Cancel booking state ────────────────────────────────────────────────
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showUploadProof, setShowUploadProof] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelSuccess, setCancelSuccess] = useState<string | null>(null);
  const [bookingError, setBookingError] = useState<string | null>(null);

  // ─── Chat state ──────────────────────────────────────────────────────────
  const [chatStarting, setChatStarting] = useState(false);

  // ─── Fetch booking details ───────────────────────────────────────────────
  const fetchBooking = useCallback(async () => {
    try {
      const res = await api.get(`/booking/my-bookings/${bookingId}`);
      setBooking(res.data.data || res.data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  useEffect(() => {
    if (!accessToken || !bookingId) return;
    fetchBooking();
  }, [accessToken, bookingId, fetchBooking]);

  // ─── Fetch inbound plans ─────────────────────────────────────────────────
  const fetchInboundPlans = useCallback(async () => {
    try {
      const res = await api.get(`/inbound/my-plans?bookingId=${bookingId}`);
      const data = res.data.data || [];
      setInboundPlans(Array.isArray(data) ? data : []);
    } catch {
      // silently handled
    } finally {
      setPlansLoading(false);
    }
  }, [bookingId]);

  useEffect(() => {
    if (!accessToken || !bookingId) return;
    fetchInboundPlans();
  }, [accessToken, bookingId, fetchInboundPlans]);

// ─── Chat with warehouse owner ──────────────────────────────────────────
const handleChatWithOwner = useCallback(async () => {
  if (!booking) return;

  // Extract owner ID accurately from nested object or direct property
  const rawOwner = booking.warehouse?.owner;
  const ownerId =
    (typeof rawOwner === "object" && rawOwner !== null
      ? rawOwner._id
      : rawOwner) ||
    booking.owner;

  const warehouseId = booking.warehouse?._id || booking.warehouseId;

  if (!ownerId) {
    setBookingError("Owner details not found for this booking.");
    setTimeout(() => setBookingError(null), 4000);
    return;
  }

  setChatStarting(true);
  try {
    const res = await api.post("/conversation/start", {
      participantId: ownerId,
      warehouseId,
    });

    // Backend sends response as { success: true, message: "...", data: conversationObj }
    const conversation = res.data?.data || res.data;
    const conversationId = conversation?._id || conversation?.id;

    if (conversationId) {
      router.push(`/messages?conversationId=${conversationId}`);
    } else {
      setBookingError("Could not retrieve conversation ID.");
      setTimeout(() => setBookingError(null), 4000);
    }
  } catch (err: any) {
    console.error("Failed to start conversation:", err);
    setBookingError(
      err.response?.data?.message || "Failed to start conversation."
    );
    setTimeout(() => setBookingError(null), 4000);
  } finally {
    setChatStarting(false);
  }
}, [booking, router]);

  // ─── Cancel booking ──────────────────────────────────────────────────────
  const handleCancelBooking = useCallback(async (reason?: string) => {
    setIsCancelling(true);
    try {
      await api.patch(`/booking/cancel/${bookingId}`, { reason: reason || "" });
      setShowCancelConfirm(false);
      setCancelSuccess("Booking cancelled successfully.");
      fetchBooking();
      setTimeout(() => setCancelSuccess(null), 3000);
    } catch {
      // error handled
    } finally {
      setIsCancelling(false);
    }
  }, [bookingId, fetchBooking]);

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" });

  const b = booking;

  // ─── Loading ─────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] pt-28 pb-20 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto animate-pulse space-y-6">
          <div className="h-6 bg-[#F8FAFC] rounded w-24" />
          <div className="h-48 bg-[#F8FAFC] rounded-3xl" />
          <div className="h-32 bg-[#F8FAFC] rounded-3xl" />
        </div>
      </div>
    );
  }

  // ─── Error / Not found ───────────────────────────────────────────────────
  if (error || !b) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] pt-28 pb-20 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center py-20">
          <AlertCircle size={40} className="mx-auto text-[#0284C7]/40 mb-4" />
          <h2 className="font-heading text-xl font-semibold text-[#1E293B] mb-2">Booking not found</h2>
          <p className="text-sm text-[#0F172A]/50 font-body mb-6">This booking may have been removed or you don&apos;t have access.</p>
          <button
            onClick={() => router.push("/my-bookings")}
            className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-full font-body text-sm font-medium hover:bg-slate-800 hover:shadow-lg hover:shadow-slate-900/20 active:scale-95 transition-all duration-200"
          >
            <ArrowLeft size={16} />
            Back to My Bookings
          </button>
        </div>
      </div>
    );
  }

  const canCancel = b.status !== "cancelled" && b.status !== "rejected";
  const isCancelledStatus = b.status?.includes("cancel") ?? false;
  const shelfCount = b.shelves?.length || 0;

  return (
    <div className="min-h-screen bg-[#F8FAFC] pt-28 pb-20 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        {/* Error Banner */}
        <AnimatePresence>
          {bookingError && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 flex items-center gap-3"
            >
              <AlertCircle size={18} className="text-red-500 shrink-0" />
              <p className="text-sm text-red-700 font-body">{bookingError}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Cancel Success Toast */}
        <AnimatePresence>
          {cancelSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center gap-3"
            >
              <CheckCircle size={18} className="text-emerald-500 shrink-0" />
              <p className="text-sm text-emerald-700 font-body">{cancelSuccess}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Back button */}
        <motion.button
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => router.push("/my-bookings")}
          className="inline-flex items-center gap-1.5 text-sm text-[#0F172A]/50 hover:text-[#1E293B] font-body transition-colors mb-6"
        >
          <ArrowLeft size={16} />
          Back to My Bookings
        </motion.button>

        {/* Pending owner approval banner */}
        <AnimatePresence>
          {b.status === "pending" && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3"
            >
              <Clock size={18} className="text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-amber-800 font-body">
                  Pending Owner Approval
                </p>
                <p className="text-xs text-amber-700/80 font-body mt-1">
                  Your booking request is awaiting confirmation from the warehouse owner. Inbound shipments can only be created once the booking is confirmed.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ═══ A. HEADER & BOOKING INFO ═══ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-[#E2E8F0] mb-8"
        >
          <div className="flex items-start justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#F8FAFC] flex items-center justify-center">
                <Warehouse size={24} className="text-[#0284C7]" />
              </div>
              <div>
                <h1 className="font-heading text-2xl sm:text-3xl font-bold text-[#1E293B] tracking-tight">
                  {b.warehouse?.name || "Booking Details"}
                </h1>
                {b.warehouse?.location && (
                  <div className="flex items-center gap-1.5 mt-1 text-sm text-[#0F172A]/50 font-body">
                    <MapPin size={14} />
                    <span>{b.warehouse.location}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <StatusBadge status={b.status} />
              <StatusBadge status={b.paymentStatus} type="payment" />
            </div>
          </div>

          {/* Rejection / Cancellation reason */}
          {(b.status === "rejected" || b.status === "cancelled") && b.cancellationReason && (
            <div className="mb-5 p-4 rounded-2xl bg-red-50 border border-red-200 flex items-start gap-3">
              <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-red-700 font-body">
                  {b.status === "rejected" ? "Reason for Rejection" : "Reason for Cancellation"}
                </p>
                <p className="mt-1 text-sm text-red-700/90 font-body leading-relaxed">
                  {b.cancellationReason}
                </p>
              </div>
            </div>
          )}

          {/* Booking details grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
            <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
              <p className="text-[10px] font-semibold tracking-wider text-[#0F172A]/50 uppercase mb-1 font-body">Start Date</p>
              <p className="text-sm font-semibold text-[#1E293B] font-body">{formatDate(b.startDate)}</p>
            </div>
            <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
              <p className="text-[10px] font-semibold tracking-wider text-[#0F172A]/50 uppercase mb-1 font-body">End Date</p>
              <p className="text-sm font-semibold text-[#1E293B] font-body">{formatDate(b.endDate)}</p>
            </div>
            <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
              <p className="text-[10px] font-semibold tracking-wider text-[#0F172A]/50 uppercase mb-1 font-body">Price / Shelf</p>
              <p className="text-sm font-semibold text-[#1E293B] font-body">Rs. {(b.pricePerShelf || 0).toLocaleString("en-PK")}/mo</p>
            </div>
            <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
              <p className="text-[10px] font-semibold tracking-wider text-[#0F172A]/50 uppercase mb-1 font-body">Shelves</p>
              <p className="text-sm font-semibold text-[#1E293B] font-body">{shelfCount}</p>
            </div>
          </div>

          {/* Total Amount */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-[#F8FAFC] to-white border border-[#E2E8F0] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard size={16} className="text-[#0284C7]" />
              <span className="text-sm font-medium text-[#1E293B] font-body">Total Amount</span>
            </div>
            <span className="font-heading text-xl font-bold text-[#1E293B] numeric">
              Rs. {(b.totalAmount || 0).toLocaleString("en-PK")}
            </span>
          </div>

          {/* ═══ PAYMENT INSTRUCTIONS & PROOF UPLOAD ═══ */}
          {b.paymentStatus !== "paid" && (
            <div className="mt-5 p-5 rounded-2xl bg-[#F8FAFC]/60 border border-[#E2E8F0]">
              <div className="flex items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-2">
                  <CreditCard size={16} className="text-[#0284C7]" />
                  <span className="text-sm font-semibold text-[#1E293B] font-body">
                    Payment Instructions
                  </span>
                </div>
                {b.paymentStatus === "payment_submitted" && (
                  <StatusBadge status="payment_submitted" type="payment" />
                )}
              </div>

              {/* Verification pending notice */}
              {b.paymentStatus === "payment_submitted" && (
                <div className="p-4 rounded-xl bg-sky-50 border border-sky-200 flex items-start gap-3 mb-4">
                  <Clock size={16} className="text-sky-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-sky-800 font-body">
                      Payment Verification Pending
                    </p>
                    <p className="text-xs text-sky-700/80 font-body mt-1">
                      Your payment proof has been submitted. The warehouse owner will verify it shortly — inbound creation unlocks once payment is confirmed.
                    </p>
                  </div>
                </div>
              )}

              {/* Rejection notice */}
              {b.paymentStatus === "payment_rejected" && (
                <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3 mb-4">
                  <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-red-700 font-body">
                      Payment Proof Rejected
                    </p>
                    <p className="text-xs text-red-600/80 font-body mt-1">
                      {b.paymentRejectionReason ||
                        "Your payment proof was rejected. Please upload a new screenshot below."}
                    </p>
                  </div>
                </div>
              )}

              {/* Owner payout details */}
              {payoutHasAnyData(b.warehouse?.payoutDetails) && (
                <div className="space-y-3 mb-5">
                  <p className="text-[10px] font-semibold tracking-wider text-[#0F172A]/50 uppercase font-body">
                    Pay to the warehouse owner
                  </p>
                  {(() => {
                    const pd = b.warehouse?.payoutDetails || {};
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
                      <div className="overflow-hidden rounded-xl border border-[#E2E8F0]">
                        {rows.map((r, i) => (
                          <div
                            key={r.label}
                            className={`flex items-center justify-between gap-3 px-4 py-2.5 text-xs font-body ${
                              i % 2 === 0 ? "bg-white" : "bg-[#F8FAFC]"
                            }`}
                          >
                            <span className="text-[#0F172A]/50">{r.label}</span>
                            <span className="font-semibold text-[#1E293B] text-right break-all">{r.value}</span>
                          </div>
                        ))}
                      </div>
                    ) : null;
                  })()}
                </div>
              )}

              {/* Booking not confirmed yet → payment locked */}
              {b.status !== "confirmed" && (
                <div className="mb-4 p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3">
                  <Clock size={16} className="text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-700/80 font-body leading-relaxed">
                    ⏳ Payment submission will unlock once the warehouse owner approves your booking request.
                  </p>
                </div>
              )}

              {/* Attempt warning — 1 remaining */}
              {b.status === "confirmed" && (b.paymentAttemptsCount || 0) === 1 && (
                <div className="mb-4 p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3">
                  <AlertCircle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-700/80 font-body leading-relaxed">
                    ⚠️ 1 attempt remaining. Please ensure screenshot details are legible.
                  </p>
                </div>
              )}

              {/* Max attempts reached → upload disabled */}
              {b.status === "confirmed" && (b.paymentAttemptsCount || 0) >= 2 && (
                <div className="mb-4 p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3">
                  <XCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-red-600/80 font-body leading-relaxed">
                    ❌ Maximum payment submission attempts reached (2/2). Contact warehouse owner for manual verification.
                  </p>
                </div>
              )}

              {/* Upload button — always visible while attempts remain (incl. attempt 2) */}
              {b.status === "confirmed" && (b.paymentAttemptsCount || 0) < 2 && (
                <button
                  onClick={() => setShowUploadProof(true)}
                  className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 bg-slate-900 text-white rounded-full font-body text-sm font-medium hover:bg-slate-800 hover:shadow-lg hover:shadow-slate-900/20 active:scale-95 transition-all duration-200"
                >
                  <Upload size={16} />
                  {(b.paymentAttemptsCount || 0) === 0
                    ? `Upload Payment Proof (1 of 2)`
                    : `Re-upload Payment Proof (Final Attempt ${(b.paymentAttemptsCount || 0) + 1} of 2)`}
                </button>
              )}
            </div>
          )}

          {/* Booked Shelves */}
          {b.shelves && b.shelves.length > 0 && (
            <div className="mt-5">
              <p className="text-[10px] font-semibold tracking-wider text-[#0F172A]/50 uppercase mb-2 font-body">Booked Shelves</p>
              <div className="flex flex-wrap gap-2">
                {b.shelves.map((shelf) => (
                  <span key={shelf._id} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#F8FAFC]/60 border border-[#E2E8F0] text-xs font-body">
                    <Layers size={12} className="text-[#0284C7]" />
                    <span className="font-medium text-[#1E293B]">{shelf.shelfNumber}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Chat with Owner + Cancel Booking */}
          <div className="mt-5 flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleChatWithOwner}
              disabled={chatStarting}
              className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 bg-[#0284C7] text-white rounded-full font-body text-sm font-medium hover:bg-[#0284C7]/90 transition-all duration-300 shadow-sm disabled:opacity-50"
            >
              {chatStarting ? (
                <><Loader2 size={16} className="animate-spin" />Starting Chat...</>
              ) : (
                <><MessageCircle size={16} />Chat with Owner</>
              )}
            </button>
            {canCancel && (
              <button
                onClick={() => setShowCancelConfirm(true)}
                className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 border-2 border-red-200 text-red-600 rounded-full font-body text-sm font-medium hover:bg-red-50 transition-all duration-300"
              >
                <Ban size={16} />
                Cancel Booking
              </button>
            )}
          </div>
        </motion.div>

        {/* ═══ B. INBOUND PLANS LIST ═══ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-[#E2E8F0] mb-8"
        >
          {/* Cancelled banner */}
          {isCancelledStatus && (
            <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 flex items-start gap-3">
              <AlertCircle size={18} className="text-red-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-700 font-body">Booking Cancelled</p>
                <p className="text-xs text-red-600/80 font-body mt-1">
                  This booking is cancelled. New inbound plans cannot be created for cancelled bookings.
                </p>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#F8FAFC] flex items-center justify-center">
                <Package size={18} className="text-[#0284C7]" />
              </div>
              <h2 className="font-heading text-xl font-semibold text-[#1E293B]">Inbound Plans</h2>
            </div>
          </div>

          {plansLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 size={24} className="animate-spin text-[#0284C7]" />
            </div>
          ) : inboundPlans.length === 0 ? (
            <div className="text-center py-12">
              <Package size={32} className="mx-auto text-[#0284C7]/30 mb-3" />
              <p className="text-sm text-[#0F172A]/50 font-body">
                {isCancelledStatus
                  ? "No inbound plans were created for this booking before it was cancelled."
                  : "No inbound plans yet for this booking."}
              </p>
              {!isCancelledStatus && (
                <p className="mt-4 text-xs text-[#0F172A]/50 font-body max-w-sm mx-auto">
                  New shipments are created from the My Bookings page — press the
                  “Create Inbound” button on this booking&apos;s card.
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {inboundPlans.map((plan) => {
                const cartonStats = plan.cartonStats || [];
                const inTransit = cartonStats.find((s) => s._id === "in-transit")?.count || 0;
                const arrived = cartonStats.find((s) => s._id === "arrived")?.count || 0;

                return (
                  <div
                    key={plan._id}
                    onClick={() => router.push(`/my-bookings/${bookingId}/inbound-plan/${plan._id}`)}
                    className="p-4 rounded-2xl bg-[#F8FAFC]/40 border border-[#E2E8F0] hover:border-[#0284C7]/30 transition-all duration-200 cursor-pointer hover:shadow-sm"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-[#1E293B] font-body">{plan.batchName}</span>
                        <StatusBadge status={plan.status} type="inbound" />
                      </div>
                      <ChevronRight size={14} className="text-[#0F172A]/30" />
                    </div>

                    <div className="flex items-center gap-4 text-xs text-[#0F172A]/60 font-body">
                      <div className="flex items-center gap-1">
                        <Package size={12} />
                        <span>{plan.totalCartons} cartons</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <CalendarDays size={12} />
                        <span>Expected: {formatDate(plan.expectedDate)}</span>
                      </div>
                    </div>

                    {(inTransit > 0 || arrived > 0) && (
                      <div className="flex items-center gap-3 mt-2 text-[11px] text-[#0F172A]/50 font-body">
                        {inTransit > 0 && <span>🚚 {inTransit} in transit</span>}
                        {arrived > 0 && <span>✅ {arrived} arrived</span>}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>

      {/* Cancel Confirmation Modal */}
      <AnimatePresence>
        {showCancelConfirm && (
          <ConfirmationModal
            title="Cancel Booking"
            message="Are you sure you want to cancel this booking? This action cannot be undone."
            confirmLabel="Confirm Cancellation"
            cancelLabel="Back"
            variant="danger"
            showReasonInput
            reasonPlaceholder="Please state the reason for cancellation"
            requireReason
            onConfirm={handleCancelBooking}
            onCancel={() => setShowCancelConfirm(false)}
            isLoading={isCancelling}
          />
        )}
      </AnimatePresence>

      {/* Upload Payment Proof Modal */}
      <AnimatePresence>
        {showUploadProof && (
          <UploadPaymentProofModal
            booking={{
              _id: bookingId,
              warehouseName: b.warehouse?.name,
              totalAmount: b.totalAmount,
            }}
            onClose={() => setShowUploadProof(false)}
            onUploaded={() => {
              setShowUploadProof(false);
              fetchBooking();
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
