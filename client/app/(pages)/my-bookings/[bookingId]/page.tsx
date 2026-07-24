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
  Plus,
  Ban,
  Package,
  Send,
  DollarSign,
  ChevronRight,
  MessageCircle,
} from "lucide-react";
import { useAppSelector } from "@/redux/hooks";
import api from "@/lib/axios";
import ConfirmationModal from "@/components/ui/ConfirmationModal";

// ─── Types ──────────────────────────────────────────────────────────────────────

interface BookingDetail {
  _id: string;
  warehouse: {
    _id: string;
    name: string;
    location: string;
    owner?: string | { _id: string };
  };
  warehouseId?: string;
  owner?: string;
  shelves: Array<{ _id: string; shelfNumber: string }>;
  startDate: string;
  endDate: string;
  status: "confirmed" | "pending" | "cancelled";
  paymentStatus: "paid" | "pending";
  totalAmount: number;
  pricePerShelf: number;
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
    paid: {
      bg: "bg-emerald-50 border-emerald-200",
      text: "text-emerald-700",
      icon: <CheckCircle size={12} />,
      label: "Paid",
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

  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-[11px] font-body font-medium ${c.bg} ${c.text}`}>
      {c.icon}
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

  // ─── Create inbound plan state ───────────────────────────────────────────
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [batchName, setBatchName] = useState("");
  const [totalCartons, setTotalCartons] = useState(1);
  const [expectedDate, setExpectedDate] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // ─── Cancel booking state ────────────────────────────────────────────────
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
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

  // ─── Create inbound plan ─────────────────────────────────────────────────
  const handleCreateInbound = useCallback(async () => {
    if (!batchName.trim() || !totalCartons || !expectedDate) return;
    setCreating(true);
    setCreateError(null);
    try {
      await api.post("/inbound/create", {
        bookingId,
        batchName: batchName.trim(),
        totalCartons,
        expectedDate,
      });
      setShowCreateForm(false);
      setBatchName("");
      setTotalCartons(1);
      setExpectedDate("");
      fetchInboundPlans();
    } catch (err: any) {
      setCreateError(err.response?.data?.message || "Failed to create inbound plan.");
    } finally {
      setCreating(false);
    }
  }, [batchName, totalCartons, expectedDate, bookingId, fetchInboundPlans]);

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
      await api.post(`/booking/cancel/${bookingId}`, { reason: reason || "" });
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
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#1E293B] text-white rounded-full font-body text-sm font-medium hover:bg-[#0284C7] transition-all duration-300"
          >
            <ArrowLeft size={16} />
            Back to My Bookings
          </button>
        </div>
      </div>
    );
  }

  const canCancel = b.status !== "cancelled";
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
            {!isCancelledStatus && (
              <button
                onClick={() => setShowCreateForm(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#1E293B] text-white rounded-full text-xs font-body font-medium hover:bg-[#0284C7] transition-all duration-300 shadow-sm"
              >
                <Plus size={14} />
                New Plan
              </button>
            )}
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
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="mt-4 inline-flex items-center gap-1.5 px-5 py-2.5 bg-[#0284C7] text-white rounded-full text-xs font-body font-medium hover:bg-[#0284C7]/90 transition-all duration-300"
                >
                  <Plus size={14} />
                  Create Your First Inbound Plan
                </button>
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

        {/* ═══ C. INBOUND PLAN CREATION FORM (hidden when cancelled) ═══ */}
        {!isCancelledStatus && (
        <AnimatePresence>
          {showCreateForm && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-[#E2E8F0] mb-8"
            >
              <div className="flex items-center gap-2.5 mb-6">
                <div className="w-9 h-9 rounded-xl bg-[#F8FAFC] flex items-center justify-center">
                  <Package size={18} className="text-[#0284C7]" />
                </div>
                <h2 className="font-heading text-lg font-semibold text-[#1E293B]">Create Inbound Plan</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold tracking-wider text-[#1E293B] uppercase mb-1.5 block font-body">Batch Name</label>
                  <input
                    type="text"
                    value={batchName}
                    onChange={(e) => setBatchName(e.target.value)}
                    placeholder="e.g. Q3 Inventory Restock"
                    className="w-full px-4 py-3 bg-[#F8FAFC]/40 border border-[#E2E8F0] rounded-xl text-sm text-[#0F172A] placeholder:text-[#0F172A]/30 focus:outline-none focus:border-[#0284C7] focus:bg-white transition-all font-body"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold tracking-wider text-[#1E293B] uppercase mb-1.5 block font-body">Total Cartons</label>
                    <input
                      type="number"
                      min={1}
                      value={totalCartons}
                      onChange={(e) => setTotalCartons(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full px-4 py-3 bg-[#F8FAFC]/40 border border-[#E2E8F0] rounded-xl text-sm text-[#0F172A] focus:outline-none focus:border-[#0284C7] focus:bg-white transition-all font-body"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold tracking-wider text-[#1E293B] uppercase mb-1.5 block font-body">Expected Date</label>
                    <input
                      type="date"
                      value={expectedDate}
                      onChange={(e) => setExpectedDate(e.target.value)}
                      min={new Date().toISOString().split("T")[0]}
                      className="w-full px-4 py-3 bg-[#F8FAFC]/40 border border-[#E2E8F0] rounded-xl text-sm text-[#0F172A] focus:outline-none focus:border-[#0284C7] focus:bg-white transition-all font-body"
                    />
                  </div>
                </div>

                {createError && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2.5">
                    <AlertCircle size={14} className="text-red-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-red-600 font-body">{createError}</p>
                  </div>
                )}

                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={handleCreateInbound}
                    disabled={creating || !batchName.trim() || !expectedDate}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-[#0284C7] text-white rounded-full text-sm font-body font-medium hover:bg-[#0284C7]/90 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                  >
                    {creating ? (
                      <><Loader2 size={16} className="animate-spin" />Creating...</>
                    ) : (
                      <><Send size={16} />Create Inbound Plan</>
                    )}
                  </button>
                  <button
                    onClick={() => setShowCreateForm(false)}
                    className="px-5 py-3 border border-[#E2E8F0] text-[#0F172A]/60 rounded-full text-sm font-body hover:bg-[#F8FAFC] transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        )}
      </div>

      {/* Cancel Confirmation Modal */}
      <AnimatePresence>
        {showCancelConfirm && (
          <ConfirmationModal
            title="Cancel Booking?"
            message="Are you sure you want to cancel this booking? This action cannot be undone."
            confirmLabel="Yes, Cancel Booking"
            cancelLabel="No, Keep Booking"
            variant="danger"
            showReasonInput
            reasonPlaceholder="Reason for cancellation (Optional)"
            onConfirm={handleCancelBooking}
            onCancel={() => setShowCancelConfirm(false)}
            isLoading={isCancelling}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
