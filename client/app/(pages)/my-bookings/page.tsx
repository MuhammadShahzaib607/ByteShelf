"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Warehouse,
  CalendarDays,
  Layers,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  CreditCard,
  MapPin,
  Ban,
  Package,
} from "lucide-react";
import { useAppSelector } from "@/redux/hooks";
import api from "@/lib/axios";
import CreateInboundModal from "@/components/ui/CreateInboundModal";

// ─── Types ──────────────────────────────────────────────────────────────────────

interface BookingData {
  _id: string;
  warehouse?: { _id: string; name: string; location: string };
  warehouseId?: string;
  warehouseName?: string;
  warehouseLocation?: string;
  shelfIds?: string[];
  shelves?: Array<{ _id: string; shelfNumber: string }>;
  startDate: string;
  endDate: string;
  status: "confirmed" | "pending" | "rejected" | "cancelled";
  paymentStatus: "paid" | "pending" | "unpaid" | "payment_submitted" | "payment_rejected";
  totalAmount: number;
  pricePerShelf?: number;
  cancellationReason?: string;
  createdAt: string;
}

interface BookingDetail extends BookingData {
  warehouse: {
    _id: string;
    name: string;
    location: string;
    latitude?: number;
    longitude?: number;
  };
  shelves: Array<{
    _id: string;
    shelfNumber: string;
  }>;
  pricePerShelf: number;
}

// ─── Status Badge ───────────────────────────────────────────────────────────────

function StatusBadge({
  status,
  type = "booking",
}: {
  status: string;
  type?: "booking" | "payment";
}) {
  const config: Record<
    string,
    { bg: string; text: string; icon: React.ReactNode; label: string }
  > = {
    confirmed: {
      bg: "bg-[#84cc16]/10 border-[#84cc16]/30",
      text: "text-[#84cc16]",
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
      bg: "bg-[#84cc16]/10 border-[#84cc16]/30",
      text: "text-[#84cc16]",
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
  };

  const c = config[status] || config.pending;

  return (
    <span
      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider border ${c.bg} ${c.text}`}
    >
      {c.icon}
      {c.label}
    </span>
  );
}

// ─── Skeleton Card ──────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-[#0284C7]/10 animate-pulse">
      <div className="p-5 space-y-4">
        <div className="h-5 bg-[#F8FAFC] rounded w-3/4" />
        <div className="h-3 bg-[#F8FAFC] rounded w-1/2" />
        <div className="flex gap-4 pt-1">
          <div className="h-8 bg-[#F8FAFC] rounded-full w-20" />
          <div className="h-8 bg-[#F8FAFC] rounded-full w-20" />
        </div>
        <div className="flex justify-between pt-1">
          <div className="h-6 bg-[#F8FAFC] rounded w-1/3" />
          <div className="h-6 bg-[#F8FAFC] rounded w-1/4" />
        </div>
      </div>
    </div>
  );
}

// `BookingDetailModal` has been removed. Clicking a booking card now navigates
// to the dedicated /my-bookings/[bookingId] page where all details live.

// ═══════════════════════════════════════════════════════════════════════════════
// PAGE
// ═══════════════════════════════════════════════════════════════════════════════

export default function MyBookingsPage() {
  const router = useRouter();
  const { accessToken, user, isCheckingAuth } = useAppSelector(
    (state) => state.auth
  );

  const [bookings, setBookings] = useState<BookingData[]>([]);
  const [loading, setLoading] = useState(true);

  // ─── Create Inbound (from an active booking card) ───────────────────────
  const [inboundBooking, setInboundBooking] = useState<BookingData | null>(null);

  // ─── Auth guard ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (isCheckingAuth) return;
    if (!accessToken) {
      router.replace("/login");
      return;
    }
  }, [accessToken, isCheckingAuth, router]);

  // ─── Fetch bookings ──────────────────────────────────────────────────────
  const fetchBookings = useCallback(async () => {
    if (!accessToken) return;
    try {
      const res = await api.get("/booking/my-bookings");
      const data = res.data.data?.bookings || res.data.data || [];
      setBookings(Array.isArray(data) ? data : []);
      setLoading(false);
    } catch {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  // ─── Helpers ─────────────────────────────────────────────────────────────
  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("en-PK", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  // ─── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#F8FAFC] pt-28 pb-20 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8"
        >
          <h1 className="font-heading text-2xl sm:text-3xl font-bold text-[#1E293B] tracking-tight">
            My Bookings
          </h1>
          <p className="mt-1 text-sm text-[#0F172A]/50 font-body">
            View all your shelf booking requests and history
          </p>
        </motion.div>

        {/* Loading */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        )}

        {/* Empty */}
        {!loading && bookings.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center mx-auto mb-4 shadow-sm shadow-slate-900/10">
              <CalendarDays size={28} className="text-[#0284C7]/40" />
            </div>
            <h3 className="font-heading text-lg font-semibold text-[#1E293B] mb-2">
              No bookings yet
            </h3>
            <p className="text-sm text-[#0F172A]/50 font-body mb-6 max-w-sm mx-auto">
              Browse available warehouses and book shelf space to get started.
            </p>
            <button
              onClick={() => router.push("/explore")}
              className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-full font-body text-sm font-medium hover:bg-slate-800 hover:shadow-lg hover:shadow-slate-900/20 active:scale-95 transition-all duration-200"
            >
              <Warehouse size={16} />
              Explore Warehouses
            </button>
          </motion.div>
        )}

        {/* Create Inbound Modal (only reachable from an active booking card) */}
        <AnimatePresence>
          {inboundBooking && (
            <CreateInboundModal
              booking={inboundBooking}
              onClose={() => setInboundBooking(null)}
              onCreated={() => {
                fetchBookings();
              }}
            />
          )}
        </AnimatePresence>

        {/* Booking Grid */}
        {!loading && bookings.length > 0 && (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0 },
              visible: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
            }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {bookings.map((booking, i) => {
              const canCancel = booking.status !== "cancelled" && booking.status !== "rejected";

              return (
                <motion.div
                  key={booking._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.06 }}
                  className="bg-white/80 backdrop-blur-xl border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] hover:-translate-y-1.5 transition-all duration-300 rounded-3xl overflow-hidden flex flex-col cursor-pointer"
                  onClick={() => router.push(`/my-bookings/${booking._id}`)}
                >
                  <div className="p-5 flex flex-col flex-1">
                    <div className="flex items-center gap-2 mb-3 flex-wrap">
                      <StatusBadge status={booking.status} />
                      <StatusBadge status={booking.paymentStatus} type="payment" />
                    </div>

                    <h3 className="font-heading text-lg font-semibold text-[#1E293B]">
                      {booking.warehouseName || booking.warehouse?.name || "Warehouse Booking"}
                    </h3>

                    {booking.warehouseLocation || booking.warehouse?.location && (
                      <div className="flex items-center gap-1.5 mt-1 text-xs text-[#0F172A]/50 font-body">
                        <MapPin size={12} />
                        <span className="truncate">{booking.warehouseLocation || booking.warehouse?.location}</span>
                      </div>
                    )}

                    <hr className="my-4 border-[#0284C7]/10" />

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 text-xs text-[#0F172A]/60 font-body">
                        <CalendarDays size={13} />
                        <span>{formatDate(booking.startDate)} – {formatDate(booking.endDate)}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-[#0F172A]/50 font-body">
                        <Layers size={13} />
                        <span>{booking.shelves?.length || booking.shelfIds?.length || 0} shelves</span>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-[#0284C7]/10 flex items-center justify-between">
                      <span className="font-heading text-lg font-bold text-[#1E293B] numeric">
                        Rs. {(booking.totalAmount || 0).toLocaleString("en-PK")}
                      </span>
                      <span className="text-[10px] text-[#0F172A]/40 font-body">
                        ID: {booking._id.slice(-8)}
                      </span>
                    </div>

                    {/* Pending owner approval notice */}
                    {booking.status === "pending" && (
                      <div className="mt-3 w-full flex items-center gap-2 px-3.5 py-2.5 bg-amber-50 border border-amber-200 rounded-xl">
                        <Clock size={13} className="text-amber-600 shrink-0" />
                        <p className="text-[11px] text-amber-700 font-body leading-snug">
                          Pending owner approval — inbound creation unlocks once the warehouse owner confirms this booking.
                        </p>
                      </div>
                    )}

                    {/* Payment verification pending notice */}
                    {booking.paymentStatus === "payment_submitted" && (
                      <div className="mt-3 w-full flex items-center gap-2 px-3.5 py-2.5 bg-sky-50 border border-sky-200 rounded-xl">
                        <Clock size={13} className="text-sky-600 shrink-0" />
                        <p className="text-[11px] text-sky-700 font-body leading-snug">
                          Payment proof submitted — awaiting owner verification.
                        </p>
                      </div>
                    )}

                    {/* Rejection / Cancellation reason */}
                    {(booking.status === "rejected" || booking.status === "cancelled") && booking.cancellationReason && (
                      <div className="mt-3 w-full px-3.5 py-2.5 bg-red-50 border border-red-200 rounded-xl">
                        <p className="text-[11px] text-red-700 font-body leading-snug">
                          <span className="font-semibold">
                            {booking.status === "rejected" ? "Reason for Rejection: " : "Reason for Cancellation: "}
                          </span>
                          {booking.cancellationReason}
                        </p>
                      </div>
                    )}

                    {/* Create Inbound — active bookings only, locked until payment is confirmed */}
                    {booking.status === "confirmed" &&
                      (booking.paymentStatus === "paid" ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setInboundBooking(booking);
                          }}
                          className="mt-3 w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-[#1a231d] text-[#84cc16] border border-[#84cc16]/40 rounded-full text-xs font-body font-semibold hover:bg-[#222e26] hover:border-[#84cc16]/60 hover:shadow-lg hover:shadow-[#84cc16]/10 active:scale-95 transition-all duration-200"
                        >
                          <Package size={12} />
                          Create Inbound
                        </button>
                      ) : (
                        <>
                          <div className="mt-3 w-full flex items-center gap-2 px-3.5 py-2.5 bg-amber-50 border border-amber-200 rounded-xl">
                            <Clock size={13} className="text-amber-600 shrink-0" />
                            <p className="text-[11px] text-amber-700 font-body leading-snug">
                              Payment Pending – Inbound creation unlocks after booking payment is confirmed.
                            </p>
                          </div>
                          <button
                            disabled
                            className="mt-2 w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-slate-100 text-slate-400 border border-slate-200 rounded-full text-xs font-body font-semibold cursor-not-allowed"
                          >
                            <Package size={12} />
                            Create Inbound
                          </button>
                        </>
                      ))}

                    {/* Cancel button inline */}
                    {canCancel && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/my-bookings/${booking._id}`);
                        }}
                        className="mt-3 w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 border-2 border-red-200 text-red-600 rounded-full text-xs font-body font-medium hover:bg-red-50 transition-all duration-200"
                      >
                        <Ban size={12} />
                        Cancel Booking
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>
    </div>
  );
}
