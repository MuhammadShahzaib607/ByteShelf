"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Layers,
  MapPin,
  DollarSign,
  Loader2,
  X,
  Package,
  Eye,
  AlertCircle,
  CheckCircle,
  CalendarDays,
  Minus,
  Plus,
} from "lucide-react";
import api from "@/lib/axios";
import ImageCarousel from "@/components/ui/ImageCarousel";

// ─── Types ──────────────────────────────────────────────────────────────────────

interface WarehouseData {
  _id: string;
  name: string;
  location: string;
  latitude: number;
  longitude: number;
  pricePerShelf: number;
  totalShelves: number;
  images: string[];
  createdAt: string;
}

interface WarehouseDetail {
  warehouse: WarehouseData;
  available: number;
  booked: number;
}

interface ShelfData {
  _id: string;
  shelfNumber: number;
  pricePerMonth: number;
  status: "available" | "booked";
}

interface WarehouseDetailsModalProps {
  warehouseId: string;
  onClose: () => void;
}

// ─── Helper: calculate months between two dates ─────────────────────────────────

function calcMonths(start: Date, end: Date): number {
  const msPerMonth = 1000 * 60 * 60 * 24 * 30.44; // average month length
  const diff = end.getTime() - start.getTime();
  return Math.max(1, Math.ceil(diff / msPerMonth));
}

// ─── Helper: format date for input value ────────────────────────────────────────

function toDateInputValue(date: Date): string {
  return date.toISOString().split("T")[0];
}

// ═══════════════════════════════════════════════════════════════════════════════
// WAREHOUSE DETAILS MODAL
// ═══════════════════════════════════════════════════════════════════════════════

const WarehouseDetailsModal: React.FC<WarehouseDetailsModalProps> = ({
  warehouseId,
  onClose,
}) => {
  const router = useRouter();
  const [detail, setDetail] = useState<WarehouseDetail | null>(null);
  const [shelves, setShelves] = useState<ShelfData[]>([]);
  const [showShelves, setShowShelves] = useState(false);
  const [loading, setLoading] = useState(true);
  const [shelvesLoading, setShelvesLoading] = useState(false);

  // ─── Booking state ────────────────────────────────────────────────────────
  const [selectedShelfIds, setSelectedShelfIds] = useState<string[]>([]);
  const [startDate, setStartDate] = useState(toDateInputValue(new Date()));
  const [endDate, setEndDate] = useState(
    toDateInputValue(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000))
  );
  const [isBooking, setIsBooking] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const fetchDetail = async () => {
      try {
        const res = await api.get(`/warehouse/${warehouseId}`);
        if (!cancelled) {
          setDetail(res.data.data);
        }
      } catch {
        // handled
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchDetail();
    return () => {
      cancelled = true;
    };
  }, [warehouseId]);

  const fetchShelves = useCallback(async () => {
    setShelvesLoading(true);
    setShowShelves(true);
    setSelectedShelfIds([]);
    try {
      const res = await api.get(
        `/shelf/warehouse/${warehouseId}/available`
      );
      setShelves(res.data.data?.shelves || res.data.data || []);
    } catch {
      // handled
    } finally {
      setShelvesLoading(false);
    }
  }, [warehouseId]);

  // ─── Toggle shelf selection ───────────────────────────────────────────────
  const toggleShelf = useCallback((shelfId: string) => {
    setSelectedShelfIds((prev) =>
      prev.includes(shelfId)
        ? prev.filter((id) => id !== shelfId)
        : [...prev, shelfId]
    );
  }, []);

  // ─── Select / Deselect all ────────────────────────────────────────────────
  const selectAll = useCallback(() => {
    setSelectedShelfIds(shelves.map((s) => s._id));
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
      setTimeout(() => {
        onClose();
        router.push("/my-bookings");
      }, 1500);
    } catch (err: any) {
      setBookingError(
        err.response?.data?.message || "Booking failed. Please try again."
      );
    } finally {
      setIsBooking(false);
    }
  }, [selectedShelfIds, warehouseId, startDate, endDate, selectedCount, onClose, router]);

  const w = detail?.warehouse;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isBooking) onClose();
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-[#0284C7]/15 overflow-hidden max-h-[85vh] flex flex-col"
      >
        {/* Header Image Carousel */}
        {w && (
          <div className="relative">
            <ImageCarousel
              images={w.images || []}
              alt={w.name}
              aspectRatio="h-48"
            />
            {w.images && w.images[0] && (
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
            )}
            <button
              onClick={onClose}
              disabled={isBooking}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/50 transition-colors z-20"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={24} className="animate-spin text-[#0284C7]" />
            </div>
          ) : w ? (
            <>
              {/* Name & Location */}
              <h2 className="font-heading text-2xl font-bold text-[#1E293B]">
                {w.name}
              </h2>
              <div className="flex items-center gap-1.5 mt-1.5 text-sm text-[#0F172A]/50 font-body">
                <MapPin size={14} />
                <span>{w.location}</span>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-3 mt-6">
                <div className="p-4 rounded-2xl bg-[#F8FAFC]/40 border border-[#0284C7]/10 text-center">
                  <DollarSign size={18} className="mx-auto text-[#0284C7]" />
                  <p className="mt-1.5 font-heading text-lg font-bold text-[#1E293B] numeric">
                    Rs. {w.pricePerShelf.toLocaleString("en-PK")}
                  </p>
                  <p className="text-[10px] text-[#0F172A]/50 font-body uppercase tracking-wider">
                    Per Shelf
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-[#F8FAFC]/40 border border-[#0284C7]/10 text-center">
                  <Package size={18} className="mx-auto text-[#0284C7]" />
                  <p className="mt-1.5 font-heading text-lg font-bold text-[#1E293B] numeric">
                    {w.totalShelves}
                  </p>
                  <p className="text-[10px] text-[#0F172A]/50 font-body uppercase tracking-wider">
                    Total
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-[#F8FAFC]/40 border border-[#0284C7]/10 text-center">
                  <Layers size={18} className="mx-auto text-[#0284C7]" />
                  <p className="mt-1.5 font-heading text-lg font-bold text-[#1E293B] numeric">
                    {detail.available ?? "—"}
                  </p>
                  <p className="text-[10px] text-[#0F172A]/50 font-body uppercase tracking-wider">
                    Available
                  </p>
                </div>
              </div>

              {/* Divider */}
              <hr className="my-6 border-[#0284C7]/10" />

              {/* Availability stats */}
              {detail.available !== undefined && detail.booked !== undefined && (
                <div className="space-y-2 mb-5">
                  <h4 className="text-xs font-semibold tracking-wider text-[#1E293B] uppercase font-body">
                    Availability Breakdown
                  </h4>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-sm font-body">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                      <span className="text-[#0F172A]/70">
                        {detail.available} Available
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm font-body">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#0284C7]/40" />
                      <span className="text-[#0F172A]/70">
                        {detail.booked} Booked
                      </span>
                    </div>
                  </div>
                </div>
              )}

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

              {/* Available Shelves with Booking */}
              {!showShelves && !bookingSuccess ? (
                <button
                  onClick={fetchShelves}
                  disabled={shelvesLoading}
                  className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 bg-[#1E293B] text-white rounded-full font-body text-sm font-medium hover:bg-[#0284C7] transition-all duration-300 shadow-sm active:scale-[0.98]"
                >
                  {shelvesLoading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <Eye size={16} />
                      View Available Shelves
                    </>
                  )}
                </button>
              ) : showShelves && !bookingSuccess ? (
                <div className="space-y-4">
                  {/* Shelf Selection Header */}
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-semibold tracking-wider text-[#1E293B] uppercase font-body">
                      Select Shelves
                    </h4>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={selectAll}
                        className="text-[10px] text-[#0284C7] font-medium hover:underline font-body"
                      >
                        Select All
                      </button>
                      <span className="text-[#0284C7]/30 text-[10px]">|</span>
                      <button
                        onClick={deselectAll}
                        className="text-[10px] text-[#0284C7] font-medium hover:underline font-body"
                      >
                        Clear
                      </button>
                    </div>
                  </div>

                  {/* Shelf Grid */}
                  {shelvesLoading ? (
                    <div className="flex justify-center py-6">
                      <Loader2 size={20} className="animate-spin text-[#0284C7]" />
                    </div>
                  ) : shelves.length === 0 ? (
                    <p className="text-sm text-[#0F172A]/50 font-body text-center py-6">
                      No shelves available at the moment.
                    </p>
                  ) : (
                    <div className="grid grid-cols-2 gap-2.5">
                      {shelves.map((shelf) => {
                        const isSelected = selectedShelfIds.includes(shelf._id);
                        return (
                          <button
                            key={shelf._id}
                            type="button"
                            onClick={() => toggleShelf(shelf._id)}
                            className={`flex items-center gap-3 px-3.5 py-3 rounded-xl border-2 text-xs font-body transition-all duration-200 ${
                              isSelected
                                ? "bg-[#F8FAFC] border-[#0284C7] text-[#1E293B] shadow-sm"
                                : "bg-white border-[#0284C7]/20 text-[#0F172A]/70 hover:border-[#0284C7]/40"
                            }`}
                          >
                            {/* Custom checkbox */}
                            <span
                              className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-all ${
                                isSelected
                                  ? "bg-[#0284C7] border-[#0284C7]"
                                  : "border-[#0284C7]/30 bg-white"
                              }`}
                            >
                              {isSelected && (
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                              )}
                            </span>
                            <div className="flex flex-col items-start">
                              <span className="font-medium text-current">
                                #{shelf.shelfNumber}
                              </span>
                              <span className="text-[#0284C7] font-medium">
                                Rs. {shelf.pricePerMonth.toLocaleString("en-PK")}/mo
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Date Pickers */}
                  {shelves.length > 0 && (
                    <div className="grid grid-cols-2 gap-3 pt-2">
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
                            className="w-full pl-8 pr-3 py-2.5 bg-[#F8FAFC]/40 border border-[#0284C7]/20 rounded-xl text-xs text-[#0F172A] focus:outline-none focus:border-[#0284C7] focus:bg-white transition-all font-body"
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
                            className="w-full pl-8 pr-3 py-2.5 bg-[#F8FAFC]/40 border border-[#0284C7]/20 rounded-xl text-xs text-[#0F172A] focus:outline-none focus:border-[#0284C7] focus:bg-white transition-all font-body"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Live Price Calculation */}
                  {selectedCount > 0 && (
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-[#F8FAFC] to-white border border-[#0284C7]/10 space-y-2">
                      <div className="flex items-center justify-between text-sm font-body">
                        <span className="text-[#0F172A]/60">Shelves selected</span>
                        <span className="font-semibold text-[#1E293B] numeric">{selectedCount}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm font-body">
                        <span className="text-[#0F172A]/60">Duration</span>
                        <span className="font-semibold text-[#1E293B] numeric">
                          {months} month{months !== 1 ? "s" : ""}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm font-body">
                        <span className="text-[#0F172A]/60">Price per shelf</span>
                        <span className="font-semibold text-[#1E293B] numeric">
                          Rs. {pricePerMonth.toLocaleString("en-PK")}/mo
                        </span>
                      </div>
                      <hr className="border-[#0284C7]/10" />
                      <div className="flex items-center justify-between font-body">
                        <span className="text-[#0F172A]/80 font-medium">
                          Estimated Total
                        </span>
                        <span className="font-heading text-lg font-bold text-[#1E293B] numeric">
                          Rs. {estimatedTotal.toLocaleString("en-PK")}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Book Now Button */}
                  <button
                    onClick={handleBooking}
                    disabled={selectedCount === 0 || isBooking}
                    className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 bg-[#1E293B] text-white rounded-full font-body text-sm font-medium hover:bg-[#0284C7] transition-all duration-300 shadow-sm shadow-slate-900/10 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#1E293B]"
                  >
                    {isBooking ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Booking...
                      </>
                    ) : (
                      <>
                        <CheckCircle size={16} />
                        Book {selectedCount > 0 ? `${selectedCount} Shelf${selectedCount > 1 ? "ves" : ""}` : "Shelves"}
                      </>
                    )}
                  </button>
                </div>
              ) : null}
            </>
          ) : (
            <div className="text-center py-12">
              <AlertCircle size={28} className="mx-auto text-[#0284C7]/40 mb-3" />
              <p className="text-sm text-[#0F172A]/50 font-body">
                Could not load warehouse details.
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default WarehouseDetailsModal;
