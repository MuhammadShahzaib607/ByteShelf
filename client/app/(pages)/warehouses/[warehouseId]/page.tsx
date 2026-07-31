"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Warehouse,
  MapPin,
  Layers,
  DollarSign,
  Loader2,
  AlertCircle,
  CheckCircle,
  CalendarDays,
  Eye,
  ChevronLeft,
  ChevronRight,
  Plus,
  ArrowRight,
  Package,
  User,
  Clock,
  XCircle,
  X,
  Phone,
  ExternalLink,
  Check,
  Lock,
  ArrowLeft,
  Tag,
  Image,
} from "lucide-react";
import { useAppSelector } from "@/redux/hooks";
import api from "@/lib/axios";
import ImageCarousel from "@/components/ui/ImageCarousel";
import Link from "next/link";
import ConfirmationModal from "@/components/ui/ConfirmationModal";

// ─── Types ──────────────────────────────────────────────────────────────────────

interface WarehouseDetail {
  warehouse: {
    _id: string;
    name: string;
    location: string;
    latitude: number;
    longitude: number;
    pricePerShelf: number;
    totalShelves: number;
    images: string[];
    createdAt: string;
    owner?: string;
  };
  available: number;
  booked: number;
}

interface ShelfData {
  _id: string;
  shelfNumber: number;
  pricePerMonth: number;
  status: "available" | "booked";
}

interface BookedShelfData extends ShelfData {
  currentBooking?: {
    _id: string;
    merchant: {
      _id: string;
      name: string;
      phone?: string;
      email?: string;
    };
    startDate: string;
    endDate: string;
    status: string;
    paymentStatus: string;
  };
}

interface WarehouseBooking {
  _id: string;
  merchant: { _id: string; name: string; phone: string; email: string };
  shelves: Array<{ _id: string; shelfNumber: string }>;
  startDate: string;
  endDate: string;
  status: "confirmed" | "cancelled" | "completed";
  paymentStatus: "pending" | "paid";
  totalAmount: number;
  pricePerShelf: number;
  createdAt: string;
}

interface InboundPlanData {
  _id: string;
  booking: string;
  batchName: string;
  totalCartons: number;
  expectedDate: string;
  status: "in-transit" | "arrived" | "completed";
  createdAt: string;
}

// ─── Helpers ────────────────────────────────────────────────────────────────────

function calcMonths(start: Date, end: Date): number {
  const msPerMonth = 1000 * 60 * 60 * 24 * 30.44;
  return Math.max(1, Math.ceil((end.getTime() - start.getTime()) / msPerMonth));
}

function toDateInputValue(date: Date): string {
  return date.toISOString().split("T")[0];
}

// ═══════════════════════════════════════════════════════════════════════════════
// PAGE
// ═══════════════════════════════════════════════════════════════════════════════

export default function WarehouseDetailPage() {
  const router = useRouter();
  const params = useParams();
  const warehouseId = params.warehouseId as string;
  const { accessToken, user, isCheckingAuth } = useAppSelector(
    (state) => state.auth
  );

  const role = user?.role || "";

  const [detail, setDetail] = useState<WarehouseDetail | null>(null);
  const [shelves, setShelves] = useState<ShelfData[]>([]);
  const [loading, setLoading] = useState(true);
  const [shelvesLoading, setShelvesLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);

  // ─── Gallery state ──────────────────────────────────────────────────────────
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // ─── Booking state (for merchants/workers) ────────────────────────────────
  const [selectedShelfIds, setSelectedShelfIds] = useState<string[]>([]);
  const [startDate, setStartDate] = useState(toDateInputValue(new Date()));
  const [endDate, setEndDate] = useState(
    toDateInputValue(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000))
  );
  const [isBooking, setIsBooking] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  // ─── Warehouse bookings state (for owners) ──────────────────────────────
  const [warehouseBookings, setWarehouseBookings] = useState<WarehouseBooking[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [bookingsError, setBookingsError] = useState(false);

  // ─── Booking detail modal state ──────────────────────────────────────────
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [selectedBookingLoading, setSelectedBookingLoading] = useState(false);
  const [selectedBookingError, setSelectedBookingError] = useState<string | null>(null);

  // ─── Inbound plans state ─────────────────────────────────────────────────
  const [bookingInbounds, setBookingInbounds] = useState<InboundPlanData[]>([]);

  // ─── Action modal states ─────────────────────────────────────────────────
  const [showMarkPaidConfirm, setShowMarkPaidConfirm] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // ─── Booked shelves with tenant info (for owner's Booked tab) ────────────
  const [bookedShelves, setBookedShelves] = useState<BookedShelfData[]>([]);
  const [bookedShelvesLoading, setBookedShelvesLoading] = useState(false);

  // ─── Shelf filter state ───────────────────────────────────────────────────
  const [shelfFilter, setShelfFilter] = useState<"all" | "available" | "booked">("all");

  // ─── Filtered shelves based on active tab ─────────────────────────────────
  const filteredShelves = shelves.filter((s) => {
    if (shelfFilter === "all") return true;
    return s.status === shelfFilter;
  });

  // ─── Add Shelves state (for owners) ───────────────────────────────────────
  const [showAddShelves, setShowAddShelves] = useState(false);
  const [addCount, setAddCount] = useState(5);
  const [isAddingShelves, setIsAddingShelves] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  // ─── Derived values ────────────────────────────────────────────────────────
  const isMerchantOrWorker = role === "merchant" || role === "worker";
  const w = detail?.warehouse;
  const isOwnWarehouse = user?.id && w?.owner && user.id === w.owner;

  // ─── Auth guard ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (isCheckingAuth) return;
    if (!accessToken) router.replace("/login");
  }, [accessToken, isCheckingAuth, router]);

  // ─── Fetch warehouse detail ───────────────────────────────────────────────
  useEffect(() => {
    if (!accessToken || !warehouseId) return;
    let cancelled = false;
    const fetchDetail = async () => {
      try {
        const res = await api.get(`/warehouse/${warehouseId}`);
        if (!cancelled) {
          setDetail(res.data.data);
        }
      } catch {
        if (!cancelled) setFetchError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchDetail();
    return () => { cancelled = true; };
  }, [accessToken, warehouseId]);

  // ─── Fetch shelves (owners see all; merchants only see available) ──────
  useEffect(() => {
    if (!accessToken || !warehouseId) return;
    let cancelled = false;
    const fetchShelvesData = async () => {
      try {
        const endpoint = isOwnWarehouse
          ? `/shelf/${warehouseId}`
          : `/shelf/warehouse/${warehouseId}/available`;
        const res = await api.get(endpoint);
        if (!cancelled) {
          const shelvesData = res.data.data?.shelves || res.data.data || [];
          setShelves(shelvesData);
        }
      } catch {
        // handled
      } finally {
        if (!cancelled) setShelvesLoading(false);
      }
    };
    fetchShelvesData();
    return () => { cancelled = true; };
  }, [accessToken, warehouseId, isOwnWarehouse]);

  // ─── Toggle shelf selection ───────────────────────────────────────────────
  const toggleShelf = useCallback((shelfId: string) => {
    setSelectedShelfIds((prev) =>
      prev.includes(shelfId)
        ? prev.filter((id) => id !== shelfId)
        : [...prev, shelfId]
    );
  }, []);

  const selectAll = useCallback(() => {
    setSelectedShelfIds(
      shelves.filter((s) => s.status === "available").map((s) => s._id)
    );
  }, [shelves]);

  const deselectAll = useCallback(() => {
    setSelectedShelfIds([]);
  }, []);

  // ─── Live price calculation ───────────────────────────────────────────────
  const pricePerMonth = detail?.warehouse?.pricePerShelf ?? 0;
  const start = new Date(startDate);
  const end = new Date(endDate);
  const months = start < end ? calcMonths(start, end) : 1;
  const selectedCount = selectedShelfIds.length;
  const estimatedTotal = selectedCount * pricePerMonth * months;

  // ─── Handle booking ───────────────────────────────────────────────────────
  const handleBooking = useCallback(async () => {
    if (selectedCount === 0) return;
    setIsBooking(true);
    setBookingError(null);
    try {
      await api.post("/booking/create", {
        warehouseId,
        shelfIds: selectedShelfIds,
        startDate,
        endDate,
      });
      setBookingSuccess(true);
      setTimeout(() => router.push("/"), 1500);
    } catch (err: any) {
      setBookingError(
        err.response?.data?.message || "Booking failed. Please try again."
      );
    } finally {
      setIsBooking(false);
    }
  }, [selectedShelfIds, warehouseId, startDate, endDate, selectedCount, router]);

  // ─── Handle add shelves (owner only) ──────────────────────────────────────
  const handleAddShelves = useCallback(async () => {
    setIsAddingShelves(true);
    setAddError(null);
    try {
      await api.post(`/shelf/add/${warehouseId}`, { numberOfShelves: addCount });
      const res = await api.get(`/shelf/${warehouseId}`);
      setShelves(res.data.data?.shelves || res.data.data || []);
      setShowAddShelves(false);
    } catch (err: any) {
      setAddError(err.response?.data?.message || "Failed to add shelves.");
    } finally {
      setIsAddingShelves(false);
    }
  }, [warehouseId, addCount]);

  // ─── Fetch booked shelves with tenant info (owner's Booked tab) ──────────
  useEffect(() => {
    if (!accessToken || !warehouseId || !isOwnWarehouse || shelfFilter !== "booked") {
      setBookedShelves([]);
      setBookedShelvesLoading(false);
      return;
    }
    let cancelled = false;
    const fetchBookedShelves = async () => {
      setBookedShelvesLoading(true);
      try {
        const res = await api.get(`/shelf/${warehouseId}/booked`);
        if (!cancelled) {
          setBookedShelves(res.data.data || []);
        }
      } catch {
        if (!cancelled) setBookedShelves([]);
      } finally {
        if (!cancelled) setBookedShelvesLoading(false);
      }
    };
    fetchBookedShelves();
    return () => { cancelled = true; };
  }, [accessToken, warehouseId, isOwnWarehouse, shelfFilter]);

  // ─── Fetch warehouse bookings (owner only) ───────────────────────────────
  useEffect(() => {
    if (!accessToken || !warehouseId || !isOwnWarehouse) return;
    let cancelled = false;
    const fetchBookings = async () => {
      try {
        setBookingsLoading(true);
        setBookingsError(false);
        const res = await api.get(`/booking/warehouse/${warehouseId}`);
        if (!cancelled) {
          setWarehouseBookings(res.data.data?.bookings || []);
        }
      } catch {
        if (!cancelled) setBookingsError(true);
      } finally {
        if (!cancelled) setBookingsLoading(false);
      }
    };
    fetchBookings();
    return () => { cancelled = true; };
  }, [accessToken, warehouseId, isOwnWarehouse]);

  // ─── Auto-clear action success toast ───────────────────────────────────────
  useEffect(() => {
    if (!actionSuccess) return;
    const t = setTimeout(() => setActionSuccess(null), 3000);
    return () => clearTimeout(t);
  }, [actionSuccess]);

  // ─── Handle view booking detail ────────────────────────────────────────────
  const handleViewBookingDetail = useCallback(async (bookingId: string) => {
    setSelectedBookingId(bookingId);
    setSelectedBookingLoading(true);
    setSelectedBookingError(null);
    setSelectedBooking(null);
    setBookingInbounds([]);
    try {
      const [detailRes, inboundRes] = await Promise.all([
        api.get(`/booking/warehouse/${warehouseId}/${bookingId}`),
        api.get(`/inbound/warehouse/${warehouseId}`),
      ]);
      setSelectedBooking(detailRes.data.data);
      const allInbounds: InboundPlanData[] = inboundRes.data.data || [];
      setBookingInbounds(allInbounds.filter((p) => p.booking === bookingId));
    } catch (err: any) {
      setSelectedBookingError(
        err.response?.data?.message || "Failed to load booking details."
      );
    } finally {
      setSelectedBookingLoading(false);
    }
  }, [warehouseId]);

  // ─── Close detail modal ─────────────────────────────────────────────────────
  const handleCloseDetail = useCallback(() => {
    setSelectedBookingId(null);
    setSelectedBooking(null);
    setSelectedBookingError(null);
    setBookingInbounds([]);
  }, []);

  // ─── Handle mark as paid ────────────────────────────────────────────────────
  const handleMarkAsPaid = useCallback(async () => {
    if (!selectedBookingId) return;
    setActionLoading(true);
    try {
      await api.patch(`/booking/warehouse/${warehouseId}/mark-paid/${selectedBookingId}`);
      setShowMarkPaidConfirm(false);
      setActionSuccess("Booking marked as paid successfully!");
      const detailRes = await api.get(`/booking/warehouse/${warehouseId}/${selectedBookingId}`);
      setSelectedBooking(detailRes.data.data);
      const listRes = await api.get(`/booking/warehouse/${warehouseId}`);
      setWarehouseBookings(listRes.data.data?.bookings || []);
    } catch (err: any) {
      setSelectedBookingError(
        err.response?.data?.message || "Failed to mark as paid."
      );
      setShowMarkPaidConfirm(false);
    } finally {
      setActionLoading(false);
    }
  }, [selectedBookingId, warehouseId]);

  // ─── Handle cancel booking ──────────────────────────────────────────────────
  const handleCancelBooking = useCallback(async (reason?: string) => {
    if (!selectedBookingId) return;
    setActionLoading(true);
    try {
      await api.patch(`/booking/warehouse/${warehouseId}/cancel/${selectedBookingId}`, {
        reason: reason || "",
      });
      setShowCancelConfirm(false);
      setActionSuccess("Booking cancelled successfully!");
      const detailRes = await api.get(`/booking/warehouse/${warehouseId}/${selectedBookingId}`);
      setSelectedBooking(detailRes.data.data);
      const listRes = await api.get(`/booking/warehouse/${warehouseId}`);
      setWarehouseBookings(listRes.data.data?.bookings || []);
    } catch (err: any) {
      setSelectedBookingError(
        err.response?.data?.message || "Failed to cancel booking."
      );
      setShowCancelConfirm(false);
    } finally {
      setActionLoading(false);
    }
  }, [selectedBookingId, warehouseId]);

  // ─── Images ────────────────────────────────────────────────────────────────
  const images = w?.images || [];

  // ─── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#F8FAFC] to-white pt-28 pb-20 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-5 bg-slate-200/60 rounded-lg w-32" />
            <div className="h-80 bg-slate-200/30 rounded-3xl" />
            <div className="grid grid-cols-3 gap-4">
              <div className="h-28 bg-slate-200/30 rounded-2xl" />
              <div className="h-28 bg-slate-200/30 rounded-2xl" />
              <div className="h-28 bg-slate-200/30 rounded-2xl" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-3">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-20 bg-slate-200/30 rounded-2xl" />
                ))}
              </div>
              <div className="h-64 bg-slate-200/30 rounded-2xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── Error ────────────────────────────────────────────────────────────────
  if (fetchError || !w) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#F8FAFC] to-white pt-28 pb-20 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto text-center py-20">
          <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-5">
            <AlertCircle size={32} className="text-red-400" />
          </div>
          <h2 className="font-heading text-2xl font-bold text-[#1E293B] mb-2">
            Warehouse not found
          </h2>
          <p className="text-sm text-[#0F172A]/50 font-body mb-8 max-w-sm mx-auto">
            This warehouse may have been removed or you don&apos;t have access.
          </p>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => router.push("/explore")}
            className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-full font-body text-sm font-medium hover:bg-slate-800 hover:shadow-lg hover:shadow-slate-900/20 transition-all duration-200"
          >
            <ChevronLeft size={16} />
            Back to Explore
          </motion.button>
        </div>
      </div>
    );
  }

  // ─── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F8FAFC] to-white pt-28 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* ═══════════════════════════════════════════════════════════════════
            BACK NAVIGATION
        ════════════════════════════════════════════════════════════════════ */}
        <motion.button
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          whileHover={{ x: -4 }}
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-sm text-[#0F172A]/50 hover:text-[#1E293B] font-body transition-all duration-200 mb-6 group"
        >
          <div className="w-7 h-7 rounded-full bg-white border border-[#E2E8F0] flex items-center justify-center group-hover:bg-slate-900 group-hover:border-slate-900 group-hover:text-white transition-all duration-200">
            <ArrowLeft size={14} />
          </div>
          <span className="font-medium">Back to Dashboard</span>
        </motion.button>

        {/* ═══════════════════════════════════════════════════════════════════
            TWO-COLUMN LAYOUT — Showcase + Info + Shelf Selector | Sticky Summary
        ════════════════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* ─── LEFT COLUMN (lg:col-span-7) ─────────────────────────────── */}
          <div className="lg:col-span-7 space-y-8">

            {/* ═══ IMAGE SHOWCASE (Blurred Backdrop) ═══ */}
            <div className="relative w-full h-[480px] rounded-3xl overflow-hidden bg-slate-950 border border-[#E2E8F0] shadow-xl">
              {images.length > 0 ? (
                <>
                  {/* Blurred backdrop */}
                  <img
                    src={images[currentImageIndex]}
                    alt=""
                    aria-hidden="true"
                    className="absolute inset-0 w-full h-full object-cover blur-xl scale-110 opacity-60 dark:opacity-40 brightness-75"
                  />

                  {/* Foreground main image */}
                  <div className="relative z-10 w-full h-full flex items-center justify-center p-4">
                    <img
                      src={images[currentImageIndex]}
                      alt={w.name}
                      className="object-contain max-h-full max-w-full"
                    />
                  </div>

                  {/* Navigation arrows */}
                  {images.length > 1 && (
                    <>
                      <button
                        onClick={() => setCurrentImageIndex((currentImageIndex - 1 + images.length) % images.length)}
                        aria-label="Previous image"
                        className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/25 text-white flex items-center justify-center hover:bg-white/25 hover:scale-110 active:scale-95 transition-all duration-200"
                      >
                        <ChevronLeft size={18} />
                      </button>
                      <button
                        onClick={() => setCurrentImageIndex((currentImageIndex + 1) % images.length)}
                        aria-label="Next image"
                        className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/25 text-white flex items-center justify-center hover:bg-white/25 hover:scale-110 active:scale-95 transition-all duration-200"
                      >
                        <ChevronRight size={18} />
                      </button>
                    </>
                  )}

                  {/* Thumbnail selectors (bottom overlay) */}
                  {images.length > 1 && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 max-w-[90%] overflow-x-auto px-3 py-2 rounded-full bg-black/50 backdrop-blur-md">
                      {images.map((img, idx) => (
                        <button
                          key={idx}
                          onClick={() => setCurrentImageIndex(idx)}
                          className={`w-12 h-12 shrink-0 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                            idx === currentImageIndex
                              ? "border-white ring-1 ring-white/50 scale-105"
                              : "border-white/20 opacity-60 hover:opacity-100"
                          }`}
                        >
                          <img src={img} alt="" className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-center">
                    <Image size={48} className="mx-auto text-slate-500 mb-2" />
                    <p className="text-xs text-slate-400 font-body">No images available</p>
                  </div>
                </div>
              )}

              {/* Owner badge */}
              {isOwnWarehouse && (
                <div className="absolute top-4 right-4 z-30 px-2.5 py-1 rounded-full bg-amber-500/90 backdrop-blur-md text-white text-[11px] font-body font-medium flex items-center gap-1.5">
                  <Warehouse size={12} />
                  Your Warehouse
                </div>
              )}

              {/* Image Counter Badge */}
              {images.length > 1 && (
                <span className="absolute top-4 left-4 z-20 bg-black/60 text-white text-xs px-2.5 py-1 rounded-full backdrop-blur-md">
                  {currentImageIndex + 1} / {images.length}
                </span>
              )}
            </div>

        {/* ═══════════════════════════════════════════════════════════════════
            WAREHOUSE IDENTITY HEADER + METRICS
        ════════════════════════════════════════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="mb-5"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="font-heading text-xl sm:text-2xl lg:text-3xl font-bold text-[#1E293B] tracking-tight">
                {w.name}
              </h1>
              <div className="flex items-center gap-2 mt-2 text-sm text-[#0F172A]/60 font-body">
                <div className="w-7 h-7 rounded-lg bg-[#0284C7]/10 flex items-center justify-center">
                  <MapPin size={14} className="text-[#0284C7]" />
                </div>
                <span>{w.location}</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="font-heading text-xl sm:text-2xl font-bold text-[#0284C7] numeric tracking-tight">
                  Rs. {w.pricePerShelf.toLocaleString("en-PK")}
                </p>
                <p className="text-xs text-[#0F172A]/50 font-body">per shelf / month</p>
              </div>
            </div>
          </div>

          {/* Metrics grid */}
          <div className="grid grid-cols-3 gap-3 sm:gap-4 mt-4">
            <motion.div
              whileHover={{ y: -2, boxShadow: "0 8px 25px rgba(0,0,0,0.06)" }}
              className="p-3 sm:p-4 rounded-2xl bg-white border border-[#E2E8F0] text-center transition-all duration-200"
            >
              <div className="w-8 h-8 rounded-xl bg-[#0284C7]/10 flex items-center justify-center mx-auto">
                <Package size={16} className="text-[#0284C7]" />
              </div>
              <p className="mt-1.5 font-heading text-lg sm:text-xl font-bold text-[#1E293B] numeric">
                {w.totalShelves}
              </p>
              <p className="text-[9px] text-[#0F172A]/50 font-body uppercase tracking-wider mt-0.5">
                Total Shelves
              </p>
            </motion.div>

            <motion.div
              whileHover={{ y: -2, boxShadow: "0 8px 25px rgba(0,0,0,0.06)" }}
              className="p-3 sm:p-4 rounded-2xl bg-white border border-[#E2E8F0] text-center transition-all duration-200"
            >
              <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center mx-auto">
                <Layers size={16} className="text-emerald-600" />
              </div>
              <p className="mt-1.5 font-heading text-lg sm:text-xl font-bold text-[#1E293B] numeric">
                {detail?.available ?? "—"}
              </p>
              <p className="text-[9px] text-[#0F172A]/50 font-body uppercase tracking-wider mt-0.5">
                Available
              </p>
            </motion.div>

            <motion.div
              whileHover={{ y: -2, boxShadow: "0 8px 25px rgba(0,0,0,0.06)" }}
              className="p-3 sm:p-4 rounded-2xl bg-white border border-[#E2E8F0] text-center transition-all duration-200"
            >
              <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center mx-auto">
                <DollarSign size={16} className="text-amber-600" />
              </div>
              <p className="mt-1.5 font-heading text-lg sm:text-xl font-bold text-[#1E293B] numeric">
                Rs. {w.pricePerShelf.toLocaleString("en-PK")}
              </p>
              <p className="text-[9px] text-[#0F172A]/50 font-body uppercase tracking-wider mt-0.5">
                Per Shelf / Mo
              </p>
            </motion.div>
          </div>
        </motion.div>

        {/* ═══════════════════════════════════════════════════════════════════
            ACTIVE BOOKINGS (Owner Only)
        ════════════════════════════════════════════════════════════════════ */}
        {isOwnWarehouse && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
            className="bg-white rounded-3xl border border-[#E2E8F0] shadow-sm hover:shadow-md transition-all duration-300 p-6 sm:p-8 mb-8"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#F8FAFC] flex items-center justify-center">
                  <CalendarDays size={20} className="text-[#0284C7]" />
                </div>
                <div>
                  <h2 className="font-heading text-lg font-semibold text-[#1E293B]">
                    Active Bookings
                  </h2>
                  <p className="text-xs text-[#0F172A]/50 font-body">
                    {warehouseBookings.length} booking{warehouseBookings.length !== 1 ? "s" : ""} for this warehouse
                  </p>
                </div>
              </div>
            </div>

            {/* Action success toast */}
            <AnimatePresence>
              {actionSuccess && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="mb-5 p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-2.5"
                >
                  <CheckCircle size={16} className="text-emerald-500 shrink-0" />
                  <p className="text-xs text-emerald-700 font-body">{actionSuccess}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {bookingsLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 size={24} className="animate-spin text-[#0284C7]" />
              </div>
            ) : bookingsError ? (
              <div className="text-center py-8">
                <AlertCircle size={24} className="mx-auto text-red-400 mb-2" />
                <p className="text-sm text-red-500 font-body">Failed to load bookings.</p>
              </div>
            ) : warehouseBookings.length === 0 ? (
              <div className="text-center py-10">
                <div className="w-12 h-12 rounded-2xl bg-[#F8FAFC] flex items-center justify-center mx-auto mb-3">
                  <CalendarDays size={22} className="text-[#0284C7]/40" />
                </div>
                <p className="text-sm text-[#0F172A]/50 font-body">
                  No bookings yet for this warehouse.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {warehouseBookings.map((booking) => (
                  <div
                    key={booking._id}
                    className="p-4 rounded-2xl bg-[#F8FAFC]/40 border border-[#E2E8F0] hover:border-[#0284C7]/20 hover:bg-[#F8FAFC]/60 transition-all duration-200"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                      <div className="flex items-center gap-2.5 min-w-0 sm:w-48 shrink-0">
                        <div className="w-8 h-8 rounded-full bg-[#1E293B] flex items-center justify-center shrink-0">
                          <User size={14} className="text-white" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-[#1E293B] font-body truncate">
                            {booking.merchant?.name || "Unknown"}
                          </p>
                          <p className="text-[10px] text-[#0F172A]/40 font-body">
                            {booking.shelves?.length || 0} shelf{(booking.shelves?.length || 0) !== 1 ? "s" : ""}
                          </p>
                        </div>
                      </div>

                      <div className="hidden md:block text-xs text-[#0F172A]/70 font-body min-w-[160px]">
                        {new Date(booking.startDate).toLocaleDateString("en-PK", { day: "numeric", month: "short" })} – {new Date(booking.endDate).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" })}
                      </div>

                      <div className="hidden md:block text-sm font-semibold text-[#1E293B] font-body numeric min-w-[100px]">
                        Rs. {(booking.totalAmount || 0).toLocaleString("en-PK")}
                      </div>

                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-body font-medium ${
                          booking.status === "confirmed"
                            ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                            : booking.status === "completed"
                            ? "bg-slate-50 border-slate-200 text-slate-600"
                            : "bg-red-50 border-red-200 text-red-700"
                        }`}>
                          {booking.status === "confirmed" ? (
                            <CheckCircle size={9} />
                          ) : booking.status === "completed" ? (
                            <CheckCircle size={9} />
                          ) : (
                            <XCircle size={9} />
                          )}
                          {booking.status === "confirmed" ? "Active" : booking.status === "completed" ? "Completed" : "Cancelled"}
                        </span>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-body font-medium ${
                          booking.paymentStatus === "paid"
                            ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                            : "bg-amber-50 border-amber-200 text-amber-700"
                        }`}>
                          {booking.paymentStatus === "paid" ? <CheckCircle size={9} /> : <Clock size={9} />}
                          {booking.paymentStatus === "paid" ? "Paid" : "Pending"}
                        </span>
                      </div>

                      <button
                        onClick={() => handleViewBookingDetail(booking._id)}
                        className="ml-auto inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-[#E2E8F0] rounded-full text-[11px] font-body font-medium text-[#1E293B] hover:border-[#0284C7]/30 hover:text-[#0284C7] transition-all duration-200 shrink-0"
                      >
                        <Eye size={13} />
                        View Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

          {/* ─── SHELF SELECTOR (inside left column) ─────────────────────────── */}

            {/* Shelf section card */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="bg-white rounded-3xl border border-[#E2E8F0] shadow-sm p-6 sm:p-8"
            >
              {/* Section header */}
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#F8FAFC] flex items-center justify-center">
                    <Layers size={20} className="text-[#0284C7]" />
                  </div>
                  <h2 className="font-heading text-lg font-semibold text-[#1E293B]">
                    Select Shelves
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  {isMerchantOrWorker && shelves.filter(s => s.status === "available").length > 0 && (
                    <>
                      <button
                        onClick={selectAll}
                        className="text-xs text-[#0284C7] font-medium hover:underline font-body"
                      >
                        Select All
                      </button>
                      <span className="text-[#0284C7]/20 text-xs">|</span>
                      <button
                        onClick={deselectAll}
                        className="text-xs text-[#0284C7] font-medium hover:underline font-body"
                      >
                        Clear
                      </button>
                    </>
                  )}
                  {isOwnWarehouse && (
                    <button
                      onClick={() => setShowAddShelves(true)}
                      className="ml-2 inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white rounded-full text-xs font-body font-medium hover:bg-slate-800 hover:shadow-lg hover:shadow-slate-900/20 active:scale-95 transition-all duration-200"
                    >
                      <Plus size={14} />
                      Add Shelves
                    </button>
                  )}
                </div>
              </div>

              {/* Booking alerts */}
              {bookingSuccess && (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center gap-3 mb-5">
                  <CheckCircle size={20} className="text-emerald-500 shrink-0" />
                  <p className="text-sm text-emerald-700 font-body">
                    Booking confirmed! Redirecting to home...
                  </p>
                </div>
              )}

              {bookingError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2.5 mb-4">
                  <AlertCircle size={14} className="text-red-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-red-600 font-body">{bookingError}</p>
                </div>
              )}

              {/* Add Shelves form (owner only) */}
              {isOwnWarehouse && showAddShelves && (
                <div className="mb-6 p-5 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0]">
                  <h3 className="text-sm font-semibold text-[#1E293B] font-body mb-3">
                    Add New Shelves
                  </h3>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      min={1}
                      value={addCount}
                      onChange={(e) => setAddCount(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-24 px-3 py-2 bg-white border border-[#E2E8F0] rounded-xl text-sm text-[#0F172A] focus:outline-none focus:border-[#0284C7] font-body"
                    />
                    <button
                      onClick={handleAddShelves}
                      disabled={isAddingShelves}
                      className="px-5 py-2 bg-slate-900 text-white rounded-full text-sm font-body font-medium hover:bg-slate-800 hover:shadow-lg hover:shadow-slate-900/20 active:scale-95 transition-all duration-200 disabled:opacity-50"
                    >
                      {isAddingShelves ? (
                        <><Loader2 size={14} className="animate-spin mr-1" />Adding...</>
                      ) : (
                        "Add Shelves"
                      )}
                    </button>
                    <button
                      onClick={() => setShowAddShelves(false)}
                      className="px-4 py-2 border border-[#E2E8F0] text-[#0F172A]/60 rounded-full text-sm font-body hover:bg-[#F8FAFC] transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                  {addError && (
                    <p className="text-xs text-red-500 font-body mt-2">{addError}</p>
                  )}
                </div>
              )}

              {/* Filter Tabs (Owner only) */}
              {isOwnWarehouse && !shelvesLoading && shelves.length > 0 && (
                <div className="flex items-center gap-1.5 mb-5">
                  {["all", "available", "booked"].map((tab) => {
                    const isActive = shelfFilter === tab;
                    return (
                      <button
                        key={tab}
                        onClick={() => setShelfFilter(tab as typeof shelfFilter)}
                        className={`px-4 py-1.5 rounded-full text-xs font-body font-medium transition-all duration-200 ${
                          isActive
                            ? "bg-[#1E293B] text-white shadow-sm"
                            : "bg-white border border-[#E2E8F0] text-[#0F172A]/50 hover:text-[#0F172A] hover:border-[#0284C7]/30"
                        }`}
                      >
                        {tab === "all" ? "All Shelves" : tab === "available" ? "Available" : "Booked"}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Legend (for merchants/workers) */}
              {isMerchantOrWorker && shelves.filter(s => s.status === "available").length > 0 && (
                <div className="flex items-center gap-4 mb-5 px-1">
                  <span className="flex items-center gap-1.5 text-[11px] text-[#0F172A]/60 font-body">
                    <span className="w-3 h-3 rounded-sm bg-emerald-500" />
                    Available
                  </span>
                  <span className="flex items-center gap-1.5 text-[11px] text-[#0F172A]/60 font-body">
                    <span className="w-3 h-3 rounded-sm bg-[#0284C7]" />
                    Selected
                  </span>
                  <span className="flex items-center gap-1.5 text-[11px] text-[#0F172A]/60 font-body">
                    <span className="w-3 h-3 rounded-sm bg-slate-200" />
                    Occupied
                  </span>
                </div>
              )}

              {/* ─── SHELF DISPLAY ──────────────────────────────────────────── */}
              {shelvesLoading || (isOwnWarehouse && shelfFilter === "booked" && bookedShelvesLoading) ? (
                <div className="flex justify-center py-12">
                  <Loader2 size={24} className="animate-spin text-[#0284C7]" />
                </div>
              ) : shelves.length === 0 && !(isOwnWarehouse && shelfFilter === "booked") ? (
                <div className="text-center py-12">
                  <div className="w-14 h-14 rounded-2xl bg-[#F8FAFC] flex items-center justify-center mx-auto mb-3">
                    <Layers size={28} className="text-[#0284C7]/30" />
                  </div>
                  <p className="text-sm text-[#0F172A]/50 font-body">
                    No shelves available at this warehouse.
                  </p>
                </div>
              ) : isOwnWarehouse && shelfFilter === "booked" ? (
                /* ── Booked Shelves Table (Owner) ── */
                <>
                  <div className="hidden sm:grid grid-cols-[1fr_100px_1.5fr_120px] gap-3 px-4 py-2.5 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] mb-1">
                    <span className="text-[10px] font-semibold tracking-wider text-[#0F172A]/50 uppercase font-body">Shelf</span>
                    <span className="text-[10px] font-semibold tracking-wider text-[#0F172A]/50 uppercase font-body">Status</span>
                    <span className="text-[10px] font-semibold tracking-wider text-[#0F172A]/50 uppercase font-body">Rate / Month</span>
                    <span className="text-[10px] font-semibold tracking-wider text-[#0F172A]/50 uppercase font-body text-center">Tenant</span>
                  </div>

                  <div className="space-y-1">
                    {bookedShelves.length === 0 ? (
                      <div className="text-center py-10">
                        <Layers size={24} className="mx-auto text-[#0284C7]/30 mb-2" />
                        <p className="text-xs text-[#0F172A]/50 font-body">No booked shelves found.</p>
                      </div>
                    ) : (
                      bookedShelves.map((shelf) => {
                        const booking = shelf.currentBooking;
                        const merchant = booking?.merchant;

                        return (
                          <div
                            key={shelf._id}
                            className="grid grid-cols-[1fr_100px_1.5fr_120px] gap-3 items-center px-4 py-3 rounded-xl border border-[#E2E8F0] bg-white hover:bg-[#F8FAFC]/40 transition-all duration-200"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center">
                                <Layers size={14} className="text-amber-600" />
                              </div>
                              <span className="font-semibold text-sm text-[#1E293B] font-body truncate">
                                Shelf #{shelf.shelfNumber}
                              </span>
                            </div>

                            <div>
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-body font-medium border bg-amber-50 border-amber-200 text-amber-700">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                Booked
                              </span>
                            </div>

                            <div className="text-sm font-semibold text-[#1E293B] font-body numeric">
                              Rs. {(shelf?.pricePerMonth ?? 0).toLocaleString("en-PK")}/mo
                            </div>

                            <div className="text-center">
                              {merchant ? (
                                <div className="flex items-center justify-center gap-2">
                                  <div className="w-6 h-6 rounded-full bg-[#1E293B] flex items-center justify-center shrink-0">
                                    <User size={10} className="text-white" />
                                  </div>
                                  <span className="text-xs font-medium text-[#1E293B] font-body truncate max-w-[80px] block">
                                    {merchant.name || "Unknown"}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-xs text-[#0F172A]/40 font-body">—</span>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {bookedShelves.length > 0 && (
                    <div className="flex items-center justify-between mt-4 px-1 text-xs text-[#0F172A]/40 font-body">
                      <span>{bookedShelves.length} booked shelf{bookedShelves.length !== 1 ? "s" : ""}</span>
                    </div>
                  )}
                </>
              ) : (
                /* ── Visual Shelf Grid (Merchant) ── */
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {filteredShelves.map((shelf) => {
                      const isAvailable = shelf.status === "available";
                      const isSelected = selectedShelfIds.includes(shelf._id);
                      const canInteract = isMerchantOrWorker && isAvailable;

                      return (
                        <motion.button
                          key={shelf._id}
                          whileTap={canInteract ? { scale: 0.95 } : undefined}
                          onClick={() => canInteract && toggleShelf(shelf._id)}
                          disabled={!canInteract}
                          className={`relative rounded-2xl border-2 p-4 text-center transition-all duration-200 ${
                            !isAvailable
                              ? "bg-slate-50 border-slate-200 opacity-50 cursor-not-allowed"
                              : isSelected
                              ? "bg-[#0284C7]/5 border-[#0284C7] shadow-[0_4px_20px_rgba(2,132,199,0.15)] cursor-pointer"
                              : canInteract
                              ? "bg-white border-[#E2E8F0] hover:border-emerald-400 hover:shadow-sm cursor-pointer hover:bg-emerald-50/30"
                              : "bg-white border-[#E2E8F0]"
                          }`}
                        >
                          {/* Shelf number */}
                          <div className={`text-sm font-bold font-body numeric ${
                            isSelected ? "text-[#0284C7]" : isAvailable ? "text-[#1E293B]" : "text-slate-400"
                          }`}>
                            #{shelf.shelfNumber}
                          </div>

                          {/* Status indicator */}
                          <div className="mt-2 flex justify-center">
                            {!isAvailable ? (
                              <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center">
                                <Lock size={12} className="text-slate-400" />
                              </div>
                            ) : isSelected ? (
                              <div className="w-6 h-6 rounded-full bg-[#0284C7] flex items-center justify-center shadow-sm">
                                <Check size={12} className="text-white" />
                              </div>
                            ) : (
                              <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center">
                                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                              </div>
                            )}
                          </div>

                          {/* Price */}
                          <p className="mt-2 text-[10px] font-medium text-[#0F172A]/50 font-body">
                            Rs. {(shelf?.pricePerMonth ?? 0).toLocaleString("en-PK")}
                          </p>

                          {/* Selected indicator dot */}
                          {isSelected && (
                            <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#0284C7] flex items-center justify-center shadow-lg shadow-[#0284C7]/30">
                              <Check size={10} className="text-white" />
                            </div>
                          )}
                        </motion.button>
                      );
                    })}
                  </div>

                  {/* Summary bar */}
                  {filteredShelves.length > 0 && (
                    <div className="flex items-center justify-between mt-5 px-1 text-xs text-[#0F172A]/40 font-body">
                      <span>
                        Showing {filteredShelves.length} of {shelves.length} shelf{filteredShelves.length !== 1 ? "es" : ""}
                      </span>
                      {isMerchantOrWorker && selectedCount > 0 && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0284C7]/10 text-[#0284C7] font-semibold text-[11px] font-body">
                          <Check size={11} />
                          {selectedCount} selected
                        </span>
                      )}
                    </div>
                  )}
                </>
              )}
            </motion.div>
          </div>

          {/* ─── RIGHT COLUMN: Sticky Booking Summary ──────────────────────── */}
          <div className="lg:col-span-5">
            <div className="sticky top-24 space-y-6">
              {isMerchantOrWorker && selectedCount > 0 && !bookingSuccess ? (
                /* Booking Summary Card */
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-white rounded-3xl border border-[#E2E8F0] shadow-lg overflow-hidden"
                >
                  {/* Card header */}
                  <div className="px-6 pt-6 pb-4 border-b border-[#E2E8F0] bg-gradient-to-r from-[#F8FAFC] to-white">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#0284C7]/10 flex items-center justify-center">
                        <Tag size={18} className="text-[#0284C7]" />
                      </div>
                      <div>
                        <h3 className="font-heading text-base font-semibold text-[#1E293B]">
                          Booking Summary
                        </h3>
                        <p className="text-[11px] text-[#0F172A]/50 font-body">
                          {selectedCount} shelf{selectedCount !== 1 ? "ves" : ""} selected
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 space-y-5">
                    {/* Selected shelves count */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-[#0F172A]/60 font-body">Selected Shelves</span>
                      <span className="text-sm font-bold text-[#1E293B] font-body numeric">{selectedCount}</span>
                    </div>

                    {/* Monthly rate */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-[#0F172A]/60 font-body">Monthly Rate</span>
                      <span className="text-sm font-bold text-[#1E293B] font-body numeric">
                        {selectedCount} x Rs. {pricePerMonth.toLocaleString("en-PK")}
                      </span>
                    </div>

                    {/* Duration selector */}
                    <div className="space-y-3">
                      <p className="text-xs font-semibold text-[#1E293B] font-body uppercase tracking-wider">
                        Rental Duration
                      </p>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] text-[#0F172A]/50 font-body mb-1.5 block">Start</label>
                          <div className="relative">
                            <CalendarDays size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#0284C7]/50 pointer-events-none" />
                            <input
                              type="date"
                              value={startDate}
                              onChange={(e) => setStartDate(e.target.value)}
                              min={toDateInputValue(new Date())}
                              className="w-full pl-7 pr-2 py-2 bg-white border border-[#E2E8F0] rounded-xl text-xs text-[#0F172A] focus:outline-none focus:border-[#0284C7] focus:ring-1 focus:ring-[#0284C7]/20 transition-all font-body"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="text-[10px] text-[#0F172A]/50 font-body mb-1.5 block">End</label>
                          <div className="relative">
                            <CalendarDays size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#0284C7]/50 pointer-events-none" />
                            <input
                              type="date"
                              value={endDate}
                              onChange={(e) => setEndDate(e.target.value)}
                              min={startDate}
                              className="w-full pl-7 pr-2 py-2 bg-white border border-[#E2E8F0] rounded-xl text-xs text-[#0F172A] focus:outline-none focus:border-[#0284C7] focus:ring-1 focus:ring-[#0284C7]/20 transition-all font-body"
                            />
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs text-[#0F172A]/50 font-body">
                        <span>Duration</span>
                        <span className="font-semibold text-[#1E293B]">{months} month{months !== 1 ? "s" : ""}</span>
                      </div>
                    </div>

                    {/* Divider */}
                    <div className="border-t border-[#E2E8F0]" />

                    {/* Total amount */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-[#1E293B] font-body">Estimated Total</span>
                      <span className="font-heading text-xl font-bold text-[#0284C7] numeric">
                        Rs. {estimatedTotal.toLocaleString("en-PK")}
                      </span>
                    </div>

                    <p className="text-[10px] text-[#0F172A]/40 font-body -mt-2">
                      {selectedCount} shelves × Rs. {pricePerMonth.toLocaleString("en-PK")} × {months} month{months !== 1 ? "s" : ""}
                    </p>

                    {/* CTA Button */}
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleBooking}
                      disabled={isBooking}
                      className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-[#0284C7] to-[#0369a1] text-white rounded-2xl font-body text-sm font-semibold hover:from-[#0369a1] hover:to-[#0284C7] active:scale-[0.98] transition-all duration-200 shadow-lg shadow-[#0284C7]/25 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isBooking ? (
                        <><Loader2 size={16} className="animate-spin" /> Processing...</>
                      ) : (
                        <><ArrowRight size={16} /> Confirm & Proceed to Booking</>
                      )}
                    </motion.button>
                  </div>
                </motion.div>
              ) : isMerchantOrWorker && selectedCount === 0 && shelves.filter(s => s.status === "available").length > 0 ? (
                /* Empty state */
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-white rounded-3xl border border-[#E2E8F0] shadow-sm p-6 text-center"
                >
                  <div className="w-12 h-12 rounded-2xl bg-[#F8FAFC] flex items-center justify-center mx-auto mb-3">
                    <Layers size={22} className="text-[#0284C7]/40" />
                  </div>
                  <p className="text-sm font-medium text-[#1E293B] font-body mb-1">No shelves selected</p>
                  <p className="text-xs text-[#0F172A]/50 font-body leading-relaxed">
                    Click on available shelves from the grid to see the pricing breakdown and book.
                  </p>
                </motion.div>
              ) : null}
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            BOOKING DETAIL MODAL (Owner Only)
        ════════════════════════════════════════════════════════════════════ */}
        <AnimatePresence>
          {selectedBookingId && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm"
              onClick={(e) => {
                if (e.target === e.currentTarget) handleCloseDetail();
              }}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="w-full max-w-2xl max-h-[85vh] overflow-y-auto bg-white rounded-3xl shadow-2xl border border-[#E2E8F0]"
              >
                {/* Modal header */}
                <div className="sticky top-0 z-10 bg-white/90 backdrop-blur-sm border-b border-[#E2E8F0] px-6 py-4 flex items-center justify-between rounded-t-3xl">
                  <h3 className="font-heading text-lg font-semibold text-[#1E293B]">
                    Booking Details
                  </h3>
                  <button
                    onClick={handleCloseDetail}
                    className="w-8 h-8 rounded-full bg-[#F8FAFC] flex items-center justify-center text-[#0F172A]/50 hover:text-[#0F172A] hover:bg-[#F1F5F9] transition-all"
                  >
                    <X size={16} />
                  </button>
                </div>

                <div className="p-6 space-y-6">
                  {/* Loading state */}
                  {selectedBookingLoading ? (
                    <div className="flex justify-center py-16">
                      <Loader2 size={28} className="animate-spin text-[#0284C7]" />
                    </div>
                  ) : selectedBookingError ? (
                    <div className="text-center py-12">
                      <AlertCircle size={32} className="mx-auto text-red-400 mb-3" />
                      <p className="text-sm text-red-500 font-body">{selectedBookingError}</p>
                      <button
                        onClick={handleCloseDetail}
                        className="mt-4 px-5 py-2 border border-[#E2E8F0] text-[#1E293B] rounded-full text-sm font-body"
                      >
                        Close
                      </button>
                    </div>
                  ) : selectedBooking ? (
                    <>
                      {/* Merchant Info */}
                      <div className="p-5 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0]">
                        <h4 className="text-[10px] font-semibold tracking-wider text-[#0F172A]/50 uppercase font-body mb-4">
                          Merchant Information
                        </h4>
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 rounded-full bg-[#1E293B] flex items-center justify-center shrink-0">
                            <User size={18} className="text-white" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-[#1E293B] font-body">
                              {selectedBooking.merchant?.name || "Unknown"}
                            </p>
                            {selectedBooking.merchant?.phone && (
                              <p className="text-xs text-[#0F172A]/50 font-body flex items-center gap-1.5 mt-0.5">
                                <Phone size={11} />
                                {selectedBooking.merchant.phone}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Booking Info Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0]">
                          <p className="text-[10px] font-semibold tracking-wider text-[#0F172A]/50 uppercase font-body mb-1">Start Date</p>
                          <p className="text-sm font-semibold text-[#1E293B] font-body">
                            {new Date(selectedBooking.startDate).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" })}
                          </p>
                        </div>
                        <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0]">
                          <p className="text-[10px] font-semibold tracking-wider text-[#0F172A]/50 uppercase font-body mb-1">End Date</p>
                          <p className="text-sm font-semibold text-[#1E293B] font-body">
                            {new Date(selectedBooking.endDate).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" })}
                          </p>
                        </div>
                        <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0]">
                          <p className="text-[10px] font-semibold tracking-wider text-[#0F172A]/50 uppercase font-body mb-1">Status</p>
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-[11px] font-body font-medium ${
                            selectedBooking.status === "confirmed"
                              ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                              : selectedBooking.status === "completed"
                              ? "bg-slate-50 border-slate-200 text-slate-600"
                              : "bg-red-50 border-red-200 text-red-700"
                          }`}>
                            {selectedBooking.status === "confirmed" ? <CheckCircle size={10} /> : selectedBooking.status === "completed" ? <CheckCircle size={10} /> : <XCircle size={10} />}
                            {selectedBooking.status === "confirmed" ? "Active" : selectedBooking.status === "completed" ? "Completed" : "Cancelled"}
                          </span>
                        </div>
                        <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0]">
                          <p className="text-[10px] font-semibold tracking-wider text-[#0F172A]/50 uppercase font-body mb-1">Payment</p>
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-[11px] font-body font-medium ${
                            selectedBooking.paymentStatus === "paid"
                              ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                              : "bg-amber-50 border-amber-200 text-amber-700"
                          }`}>
                            {selectedBooking.paymentStatus === "paid" ? <CheckCircle size={10} /> : <Clock size={10} />}
                            {selectedBooking.paymentStatus === "paid" ? "Paid" : "Pending"}
                          </span>
                        </div>
                      </div>

                      {/* Reserved Shelves */}
                      <div className="p-5 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0]">
                        <h4 className="text-[10px] font-semibold tracking-wider text-[#0F172A]/50 uppercase font-body mb-3">
                          Reserved Shelves ({selectedBooking.shelves?.length || 0})
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {selectedBooking.shelves?.map((s: any) => (
                            <span
                              key={s._id}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-[#E2E8F0] text-xs font-medium text-[#1E293B] font-body"
                            >
                              <Layers size={12} className="text-[#0284C7]" />
                              Shelf #{s.shelfNumber}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Amount */}
                      <div className="p-5 rounded-2xl bg-gradient-to-r from-[#F8FAFC] to-white border border-[#E2E8F0]">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-[#0F172A]/60 font-body">Total Amount</span>
                          <span className="font-heading text-2xl font-bold text-[#0284C7] numeric">
                            Rs. {(selectedBooking.totalAmount || 0).toLocaleString("en-PK")}
                          </span>
                        </div>
                      </div>

                      {/* Inbound Shipments */}
                      <div className="p-5 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0]">
                        <h4 className="text-[10px] font-semibold tracking-wider text-[#0F172A]/50 uppercase font-body mb-4">
                          Inbound Shipments
                        </h4>
                        {bookingInbounds.length === 0 ? (
                          <div className="text-center py-6">
                            <Package size={24} className="mx-auto text-[#0284C7]/30 mb-2" />
                            <p className="text-xs text-[#0F172A]/50 font-body">
                              No inbound shipments yet for this booking.
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {bookingInbounds.map((inbound) => (
                              <Link
                                key={inbound._id}
                                href={`/inbounds/${inbound._id}`}
                                className="p-4 rounded-xl bg-white border border-[#E2E8F0] flex items-center justify-between gap-3 hover:border-[#1E293B] hover:shadow-sm cursor-pointer transition-all duration-200 group"
                              >
                                <div className="min-w-0">
                                  <p className="text-sm font-semibold text-[#1E293B] font-body truncate group-hover:text-[#0284C7] transition-colors duration-200">
                                    {inbound.batchName}
                                  </p>
                                  <div className="flex items-center gap-3 mt-1 text-[11px] text-[#0F172A]/50 font-body">
                                    <span>{inbound.totalCartons} carton{inbound.totalCartons !== 1 ? "s" : ""}</span>
                                    <span>·</span>
                                    <span>Expected: {new Date(inbound.expectedDate).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" })}</span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-[10px] font-body font-medium ${
                                    inbound.status === "completed"
                                      ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                                      : inbound.status === "arrived"
                                      ? "bg-blue-50 border-blue-200 text-blue-700"
                                      : "bg-amber-50 border-amber-200 text-amber-700"
                                  }`}>
                                    {inbound.status === "completed" ? (
                                      <CheckCircle size={9} />
                                    ) : inbound.status === "arrived" ? (
                                      <CheckCircle size={9} />
                                    ) : (
                                      <Clock size={9} />
                                    )}
                                    {inbound.status === "in-transit" ? "In Transit" : inbound.status === "arrived" ? "Arrived" : "Completed"}
                                  </span>
                                  <ExternalLink size={13} className="text-[#0F172A]/20 group-hover:text-[#0284C7] transition-colors duration-200" />
                                </div>
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Owner Action Buttons */}
                      {selectedBooking.status === "confirmed" && (
                        <div className="flex items-center gap-3 pt-2">
                          <button
                            onClick={() => setShowMarkPaidConfirm(true)}
                            disabled={selectedBooking.paymentStatus === "paid"}
                            className={`flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl text-sm font-body font-medium transition-all duration-200 shadow-sm ${
                              selectedBooking.paymentStatus === "paid"
                                ? "bg-emerald-50 text-emerald-400 border border-emerald-200 cursor-not-allowed"
                                : "bg-emerald-600 text-white hover:bg-emerald-700 active:scale-[0.98]"
                            }`}
                          >
                            <CheckCircle size={16} />
                            {selectedBooking.paymentStatus === "paid" ? "Already Paid" : "Mark as Paid"}
                          </button>
                          <button
                            onClick={() => setShowCancelConfirm(true)}
                            className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl text-sm font-body font-medium transition-all duration-200 border-2 border-red-200 text-red-600 hover:bg-red-50 active:scale-[0.98]"
                          >
                            <XCircle size={16} />
                            Cancel Booking
                          </button>
                        </div>
                      )}
                    </>
                  ) : null}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Confirmation Modals */}
        <AnimatePresence>
          {showMarkPaidConfirm && (
            <ConfirmationModal
              title="Mark as Paid"
              message="Are you sure you want to mark this booking as paid?"
              confirmLabel="Yes, Mark as Paid"
              cancelLabel="Cancel"
              variant="info"
              onConfirm={handleMarkAsPaid}
              onCancel={() => setShowMarkPaidConfirm(false)}
              isLoading={actionLoading}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showCancelConfirm && (
            <ConfirmationModal
              title="Cancel Booking"
              message="Are you sure you want to cancel this booking? This action cannot be undone."
              confirmLabel="Yes, Cancel Booking"
              cancelLabel="Go Back"
              variant="danger"
              showReasonInput={true}
              reasonPlaceholder="Enter cancellation reason (required)"
              onConfirm={handleCancelBooking}
              onCancel={() => setShowCancelConfirm(false)}
              isLoading={actionLoading}
            />
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
