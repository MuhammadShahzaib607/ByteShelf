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
  Plus,
  ArrowRight,
  Package,
} from "lucide-react";
import { useAppSelector } from "@/redux/hooks";
import api from "@/lib/axios";
import ImageCarousel from "@/components/ui/ImageCarousel";
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

  // ─── Booking state (for merchants/workers) ────────────────────────────────
  const [selectedShelfIds, setSelectedShelfIds] = useState<string[]>([]);
  const [startDate, setStartDate] = useState(toDateInputValue(new Date()));
  const [endDate, setEndDate] = useState(
    toDateInputValue(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000))
  );
  const [isBooking, setIsBooking] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [bookingSuccess, setBookingSuccess] = useState(false);

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

  // ─── Fetch available shelves ─────────────────────────────────────────────
  useEffect(() => {
    if (!accessToken || !warehouseId) return;
    let cancelled = false;
    const fetchShelvesData = async () => {
      try {
        const res = await api.get(`/shelf/warehouse/${warehouseId}/available`);
        if (!cancelled) {
          setShelves(res.data.data?.shelves || res.data.data || []);
        }
      } catch {
        // handled
      } finally {
        if (!cancelled) setShelvesLoading(false);
      }
    };
    fetchShelvesData();
    return () => { cancelled = true; };
  }, [accessToken, warehouseId]);

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
      setTimeout(() => router.push("/my-bookings"), 1500);
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
      // Refetch shelves
      const res = await api.get(`/shelf/warehouse/${warehouseId}/available`);
      setShelves(res.data.data?.shelves || res.data.data || []);
      setShowAddShelves(false);
    } catch (err: any) {
      setAddError(err.response?.data?.message || "Failed to add shelves.");
    } finally {
      setIsAddingShelves(false);
    }
  }, [warehouseId, addCount]);

  const isMerchantOrWorker = role === "merchant" || role === "worker";
  const isOwner = role === "warehouseOwner";

  const w = detail?.warehouse;

  // ─── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-white pt-28 pb-20 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-6 bg-[#F8FAFC] rounded w-24" />
            <div className="h-64 bg-[#F8FAFC] rounded-3xl" />
            <div className="grid grid-cols-3 gap-4">
              <div className="h-24 bg-[#F8FAFC] rounded-2xl" />
              <div className="h-24 bg-[#F8FAFC] rounded-2xl" />
              <div className="h-24 bg-[#F8FAFC] rounded-2xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── Error ────────────────────────────────────────────────────────────────
  if (fetchError || !w) {
    return (
      <div className="min-h-screen bg-white pt-28 pb-20 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto text-center py-20">
          <AlertCircle size={40} className="mx-auto text-[#0284C7]/40 mb-4" />
          <h2 className="font-heading text-xl font-semibold text-[#1E293B] mb-2">
            Warehouse not found
          </h2>
          <p className="text-sm text-[#0F172A]/50 font-body mb-6">
            This warehouse may have been removed or you don&apos;t have access.
          </p>
          <button
            onClick={() => router.push("/explore")}
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#1E293B] text-white rounded-full font-body text-sm font-medium hover:bg-[#0284C7] transition-all duration-300"
          >
            <ChevronLeft size={16} />
            Back to Explore
          </button>
        </div>
      </div>
    );
  }

  // ─── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-white pt-28 pb-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <motion.button
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => router.back()}
          className="inline-flex items-center gap-1.5 text-sm text-[#0F172A]/50 hover:text-[#1E293B] font-body transition-colors mb-6"
        >
          <ChevronLeft size={16} />
          Back
        </motion.button>

        {/* Hero Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-3xl overflow-hidden shadow-sm border border-[#E2E8F0] mb-8"
        >
          <ImageCarousel images={w.images || []} alt={w.name} aspectRatio="h-64 sm:h-72" />
          <div className="p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="font-heading text-2xl sm:text-3xl font-bold text-[#1E293B]">
                  {w.name}
                </h1>
                <div className="flex items-center gap-1.5 mt-1.5 text-sm text-[#0F172A]/50 font-body">
                  <MapPin size={14} />
                  <span>{w.location}</span>
                </div>
              </div>
              <div className="text-right">
                <p className="font-heading text-2xl font-bold text-[#0284C7] numeric">
                  Rs. {w.pricePerShelf.toLocaleString("en-PK")}
                </p>
                <p className="text-xs text-[#0F172A]/50 font-body">per shelf / month</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="grid grid-cols-3 gap-4 mb-8"
        >
          <div className="p-5 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] text-center">
            <Package size={20} className="mx-auto text-[#0284C7]" />
            <p className="mt-2 font-heading text-xl font-bold text-[#1E293B] numeric">
              {w.totalShelves}
            </p>
            <p className="text-[10px] text-[#0F172A]/50 font-body uppercase tracking-wider">
              Total Shelves
            </p>
          </div>
          <div className="p-5 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] text-center">
            <Layers size={20} className="mx-auto text-[#0284C7]" />
            <p className="mt-2 font-heading text-xl font-bold text-[#1E293B] numeric">
              {detail?.available ?? "—"}
            </p>
            <p className="text-[10px] text-[#0F172A]/50 font-body uppercase tracking-wider">
              Available
            </p>
          </div>
          <div className="p-5 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] text-center">
            <DollarSign size={20} className="mx-auto text-[#0284C7]" />
            <p className="mt-2 font-heading text-xl font-bold text-[#1E293B] numeric">
              Rs. {w.pricePerShelf.toLocaleString("en-PK")}
            </p>
            <p className="text-[10px] text-[#0F172A]/50 font-body uppercase tracking-wider">
              Per Shelf / Mo
            </p>
          </div>
        </motion.div>

        {/* Shelf Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-[#E2E8F0]"
        >
          {/* Section Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-heading text-xl font-semibold text-[#1E293B]">
              Available Shelves
            </h2>
            {isMerchantOrWorker && shelves.length > 0 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={selectAll}
                  className="text-xs text-[#0284C7] font-medium hover:underline font-body"
                >
                  Select All
                </button>
                <span className="text-[#0284C7]/30 text-xs">|</span>
                <button
                  onClick={deselectAll}
                  className="text-xs text-[#0284C7] font-medium hover:underline font-body"
                >
                  Clear
                </button>
              </div>
            )}
            {isOwner && (
              <button
                onClick={() => setShowAddShelves(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#1E293B] text-white rounded-full text-xs font-body font-medium hover:bg-[#0284C7] transition-all duration-300 shadow-sm"
              >
                <Plus size={14} />
                Add Shelves
              </button>
            )}
          </div>

          {/* Booking Success */}
          {bookingSuccess && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center gap-3 mb-5">
              <CheckCircle size={20} className="text-emerald-500 shrink-0" />
              <p className="text-sm text-emerald-700 font-body">
                Booking confirmed! Redirecting to your bookings...
              </p>
            </div>
          )}

          {/* Booking Error */}
          {bookingError && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2.5 mb-4">
              <AlertCircle size={14} className="text-red-500 shrink-0 mt-0.5" />
              <p className="text-xs text-red-600 font-body">{bookingError}</p>
            </div>
          )}

          {/* Add Shelves (Owner) */}
          {isOwner && showAddShelves && (
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
                  className="px-5 py-2 bg-[#1E293B] text-white rounded-full text-sm font-body font-medium hover:bg-[#0284C7] transition-all duration-300 disabled:opacity-50"
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

          {/* Filter Tabs */}
          {!shelvesLoading && shelves.length > 0 && (
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

          {/* Shelf List / Table View */}
          {shelvesLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 size={24} className="animate-spin text-[#0284C7]" />
            </div>
          ) : shelves.length === 0 ? (
            <div className="text-center py-12">
              <Layers size={32} className="mx-auto text-[#0284C7]/30 mb-3" />
              <p className="text-sm text-[#0F172A]/50 font-body">
                No shelves available at this warehouse.
              </p>
            </div>
          ) : (
            <>
              {/* Table Header */}
              <div className="hidden sm:grid grid-cols-[1fr_100px_130px_60px] gap-3 px-4 py-2.5 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] mb-1">
                <span className="text-[10px] font-semibold tracking-wider text-[#0F172A]/50 uppercase font-body">Shelf</span>
                <span className="text-[10px] font-semibold tracking-wider text-[#0F172A]/50 uppercase font-body">Status</span>
                <span className="text-[10px] font-semibold tracking-wider text-[#0F172A]/50 uppercase font-body">Rate / Month</span>
                {isMerchantOrWorker && (
                  <span className="text-[10px] font-semibold tracking-wider text-[#0F172A]/50 uppercase font-body text-center">Select</span>
                )}
              </div>

              {/* Table Rows */}
              <div className="space-y-1">
                {filteredShelves.map((shelf) => {
                  const isAvailable = shelf.status === "available";
                  const isSelected = selectedShelfIds.includes(shelf._id);
                  const canInteract = isMerchantOrWorker && isAvailable;

                  return (
                    <div
                      key={shelf._id}
                      onClick={() => canInteract && toggleShelf(shelf._id)}
                      className={`grid grid-cols-[1fr_100px_130px_60px] sm:grid-cols-[1fr_100px_130px_60px] gap-3 items-center px-4 py-3 rounded-xl border transition-all duration-200 ${
                        !isAvailable
                          ? "bg-[#F8FAFC]/40 border-[#E2E8F0] opacity-60"
                          : isSelected
                          ? "bg-[#F8FAFC] border-[#0284C7] shadow-sm cursor-pointer"
                          : isMerchantOrWorker
                          ? "bg-white border-[#E2E8F0] hover:border-[#0284C7]/40 cursor-pointer"
                          : "bg-white border-[#E2E8F0]"
                      }`}
                    >
                      {/* Shelf Number */}
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${isAvailable ? "bg-[#0284C7]/10" : "bg-[#0F172A]/5"}`}>
                          <Layers size={14} className={isAvailable ? "text-[#0284C7]" : "text-[#0F172A]/30"} />
                        </div>
                        <span className="font-semibold text-sm text-[#1E293B] font-body truncate">
                          Shelf #{shelf.shelfNumber}
                        </span>
                      </div>

                      {/* Status Badge */}
                      <div>
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-body font-medium border ${
                          isAvailable
                            ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                            : "bg-amber-50 border-amber-200 text-amber-700"
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${isAvailable ? "bg-emerald-500" : "bg-amber-500"}`} />
                          {isAvailable ? "Available" : "Booked"}
                        </span>
                      </div>

                      {/* Rate */}
                      <div>
                        <span className="text-sm font-semibold text-[#1E293B] font-body numeric">
                          Rs. {(shelf?.pricePerMonth ?? 0).toLocaleString("en-PK")}/mo
                        </span>
                      </div>

                      {/* Selection Checkbox (merchant/worker only) */}
                      <div className="flex justify-center">
                        {canInteract ? (
                          <span
                            className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-200 ${
                              isSelected
                                ? "bg-[#0284C7] border-[#0284C7]"
                                : "border-[#0284C7]/30 bg-white"
                            }`}
                          >
                            {isSelected && (
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            )}
                          </span>
                        ) : (
                          <span className="text-[#0F172A]/20 text-xs">—</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Selection summary */}
              {isMerchantOrWorker && filteredShelves.length > 0 && (
                <div className="flex items-center justify-between mt-4 px-1 text-xs text-[#0F172A]/40 font-body">
                  <span>
                    Showing {filteredShelves.length} of {shelves.length} shelf{filteredShelves.length !== 1 ? "s" : ""}
                  </span>
                  {selectedCount > 0 && (
                    <span className="font-medium text-[#0284C7]">
                      {selectedCount} selected
                    </span>
                  )}
                </div>
              )}
            </>
          )}

          {/* Booking Summary (Merchants only) */}
          {isMerchantOrWorker && selectedCount > 0 && !bookingSuccess && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 p-5 rounded-2xl bg-gradient-to-br from-[#F8FAFC] to-white border border-[#E2E8F0]"
            >
              {/* Date Pickers */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="text-[10px] font-semibold tracking-wider text-[#1E293B] uppercase mb-1.5 block font-body">
                    Start Date
                  </label>
                  <div className="relative">
                    <CalendarDays size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#0284C7]/50 pointer-events-none" />
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      min={toDateInputValue(new Date())}
                      className="w-full pl-8 pr-3 py-2.5 bg-white border border-[#E2E8F0] rounded-xl text-xs text-[#0F172A] focus:outline-none focus:border-[#0284C7] transition-all font-body"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-semibold tracking-wider text-[#1E293B] uppercase mb-1.5 block font-body">
                    End Date
                  </label>
                  <div className="relative">
                    <CalendarDays size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#0284C7]/50 pointer-events-none" />
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      min={startDate}
                      className="w-full pl-8 pr-3 py-2.5 bg-white border border-[#E2E8F0] rounded-xl text-xs text-[#0F172A] focus:outline-none focus:border-[#0284C7] transition-all font-body"
                    />
                  </div>
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="space-y-2 text-sm font-body mb-4">
                <div className="flex justify-between">
                  <span className="text-[#0F172A]/60">Shelves selected</span>
                  <span className="font-semibold text-[#1E293B] numeric">{selectedCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#0F172A]/60">Duration</span>
                  <span className="font-semibold text-[#1E293B] numeric">{months} month{months !== 1 ? "s" : ""}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#0F172A]/60">Rate per shelf</span>
                  <span className="font-semibold text-[#1E293B] numeric">Rs. {pricePerMonth.toLocaleString("en-PK")}/mo</span>
                </div>
                <hr className="border-[#E2E8F0]" />
                <div className="flex justify-between">
                  <span className="font-medium text-[#1E293B]">Estimated Total</span>
                  <span className="font-heading text-lg font-bold text-[#1E293B] numeric">
                    Rs. {estimatedTotal.toLocaleString("en-PK")}
                  </span>
                </div>
              </div>

              <button
                onClick={handleBooking}
                disabled={isBooking}
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-[#0284C7] text-white rounded-full font-body text-sm font-medium hover:bg-[#0284C7]/90 transition-all duration-300 shadow-sm shadow-slate-900/10 active:scale-[0.98] disabled:opacity-50"
              >
                {isBooking ? (
                  <><Loader2 size={16} className="animate-spin" />Booking...</>
                ) : (
                  <><ArrowRight size={16} />Proceed to Book Shelves</>
                )}
              </button>
            </motion.div>
          )}

          {/* Owner info */}
          {selectedCount === 0 && isMerchantOrWorker && shelves.length > 0 && (
            <p className="mt-5 text-xs text-[#0F172A]/40 font-body text-center">
              Select available shelves above to see pricing and book.
            </p>
          )}
        </motion.div>
      </div>
    </div>
  );
}
