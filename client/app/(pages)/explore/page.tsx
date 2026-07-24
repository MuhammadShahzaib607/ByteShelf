"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Warehouse,
  MapPin,
  Layers,
  DollarSign,
  Loader2,
  Search,
  ChevronDown,
  ChevronRight,
  Package,
  Eye,
} from "lucide-react";
import { useAppSelector } from "@/redux/hooks";
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

interface FetchResponse {
  warehouses: WarehouseData[];
  currentPage: number;
  totalPages: number;
  totalWarehouses: number;
}

// ─── Skeleton Card ──────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-[#0284C7]/10 animate-pulse">
      <div className="h-48 bg-[#F8FAFC]" />
      <div className="p-5 space-y-3">
        <div className="h-5 bg-[#F8FAFC] rounded w-3/4" />
        <div className="h-3 bg-[#F8FAFC] rounded w-1/2" />
        <div className="flex justify-between pt-2">
          <div className="h-6 bg-[#F8FAFC] rounded w-1/3" />
          <div className="h-4 bg-[#F8FAFC] rounded w-1/4" />
        </div>
        <div className="h-10 bg-[#F8FAFC] rounded-full w-full mt-2" />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PAGE
// ═══════════════════════════════════════════════════════════════════════════════

export default function ExplorePage() {
  const router = useRouter();
  const { accessToken, isCheckingAuth } = useAppSelector((state) => state.auth);

  const [warehouses, setWarehouses] = useState<WarehouseData[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalWarehouses, setTotalWarehouses] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");


  // ─── Auth guard ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (isCheckingAuth) return;
    if (!accessToken) router.replace("/login");
  }, [accessToken, isCheckingAuth, router]);

  // ─── Fetch warehouses ────────────────────────────────────────────────────
  const fetchWarehouses = useCallback(
    async (page: number, append: boolean = false) => {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      try {
        const res = await api.get(
          `/warehouse/all?limit=6&page=${page}`
        );
        const data: FetchResponse = res.data.data;

        if (append) {
          setWarehouses((prev) => [...prev, ...(data.warehouses || [])]);
        } else {
          setWarehouses(data.warehouses || []);
        }
        setCurrentPage(data.currentPage || page);
        setTotalPages(data.totalPages || 1);
        setTotalWarehouses(data.totalWarehouses || 0);
      } catch {
        // handled
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    []
  );

  // ─── Initial load ────────────────────────────────────────────────────────
  useEffect(() => {
    if (isCheckingAuth) return;
    if (!accessToken) return;
    fetchWarehouses(1);
  }, [accessToken, isCheckingAuth, fetchWarehouses]);

  // ─── Load More ───────────────────────────────────────────────────────────
  const handleLoadMore = useCallback(() => {
    if (loadingMore || currentPage >= totalPages) return;
    fetchWarehouses(currentPage + 1, true);
  }, [currentPage, totalPages, loadingMore, fetchWarehouses]);

  // ─── Filtered warehouses (client-side search) ────────────────────────────
  const filteredWarehouses = warehouses.filter((w) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      w.name.toLowerCase().includes(q) ||
      w.location.toLowerCase().includes(q)
    );
  });

  const hasMore = currentPage < totalPages;

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
            Explore Warehouses
          </h1>
          <p className="mt-1 text-sm text-[#0F172A]/50 font-body">
            Browse available micro-warehouses across all locations
          </p>
        </motion.div>

        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
          className="relative mb-8"
        >
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-[#0284C7]/50 pointer-events-none"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name or location..."
            className="w-full pl-11 pr-4 py-3.5 bg-white border border-[#0284C7]/20 rounded-2xl text-[#0F172A] placeholder:text-[#0F172A]/30 focus:outline-none focus:border-[#0284C7] focus:ring-2 focus:ring-[#0284C7]/10 transition-all text-sm font-body shadow-sm shadow-slate-900/10"
          />
        </motion.div>

        {/* Total count */}
        {!loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="flex items-center gap-2 mb-6 text-sm text-[#0F172A]/50 font-body"
          >
            <Package size={14} />
            <span>
              {totalWarehouses} warehouse{totalWarehouses !== 1 ? "s" : ""}{" "}
              available
              {searchQuery.trim() &&
                ` · ${filteredWarehouses.length} match${
                  filteredWarehouses.length !== 1 ? "es" : ""
                }`}
            </span>
          </motion.div>
        )}

        {/* Initial Loading */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        )}

        {/* Empty (initial load done, no results) */}
        {!loading && warehouses.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center mx-auto mb-4 shadow-sm shadow-slate-900/10">
              <Warehouse size={28} className="text-[#0284C7]/40" />
            </div>
            <h3 className="font-heading text-lg font-semibold text-[#1E293B] mb-2">
              No warehouses found
            </h3>
            <p className="text-sm text-[#0F172A]/50 font-body max-w-sm mx-auto">
              There are no warehouses available yet. Check back later!
            </p>
          </motion.div>
        )}

        {/* Empty search results */}
        {!loading && warehouses.length > 0 && filteredWarehouses.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center mx-auto mb-3 shadow-sm shadow-slate-900/10">
              <Search size={22} className="text-[#0284C7]/40" />
            </div>
            <h3 className="font-heading text-base font-semibold text-[#1E293B] mb-1">
              No matches
            </h3>
            <p className="text-sm text-[#0F172A]/50 font-body">
              Try a different search term
            </p>
          </motion.div>
        )}

        {/* Warehouse Grid */}
        {!loading && filteredWarehouses.length > 0 && (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: { staggerChildren: 0.06, delayChildren: 0.05 },
              },
            }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8"
          >
            {filteredWarehouses.map((w, i) => (
              <motion.div
                key={w._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.06 }}
                className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 hover:-translate-y-1 border border-[#0284C7]/10 flex flex-col"
              >
                {/* Image Carousel (shared component) */}
                <ImageCarousel
                  images={w.images || []}
                  alt={w.name}
                  aspectRatio="h-48"
                />

                {/* Content */}
                <div className="p-5 flex flex-col flex-1">
                  <h3 className="font-heading text-lg font-semibold text-[#1E293B]">
                    {w.name}
                  </h3>
                  <div className="mt-1.5 flex items-center gap-1.5 text-xs text-[#0F172A]/50 font-body">
                    <MapPin size={12} />
                    <span className="truncate">{w.location}</span>
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <div>
                      <span className="font-heading text-xl font-bold text-[#1E293B] numeric">
                        Rs. {w.pricePerShelf.toLocaleString("en-PK")}
                      </span>
                      <span className="text-xs text-[#0F172A]/50 font-body ml-1">
                        /shelf/mo
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-[#0F172A]/50 font-body">
                      <Layers size={13} />
                      <span>{w.totalShelves} shelves</span>
                    </div>
                  </div>

                  <button
                    onClick={() => router.push(`/warehouses/${w._id}`)}
                    className="mt-4 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#1E293B] text-white text-sm font-body font-medium rounded-full hover:bg-[#0284C7] transition-all duration-300 shadow-sm shadow-slate-900/10 hover:shadow-md"
                  >
                    <Eye size={15} />
                    View Details & Shelves
                  </button>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Load More */}
        {!loading && hasMore && filteredWarehouses.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mt-10 text-center"
          >
            <button
              onClick={handleLoadMore}
              disabled={loadingMore}
              className="inline-flex items-center gap-2.5 px-8 py-3.5 bg-white border border-[#0284C7]/20 text-[#1E293B] rounded-full font-body font-medium text-sm hover:bg-[#F8FAFC]/60 transition-all duration-300 shadow-sm shadow-slate-900/10 hover:shadow-md active:scale-[0.98] disabled:opacity-60"
            >
              {loadingMore ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <ChevronDown size={18} />
                  Load More
                </>
              )}
            </button>
            <p className="mt-3 text-xs text-[#0F172A]/40 font-body">
              Showing {warehouses.length} of {totalWarehouses} warehouses
            </p>
          </motion.div>
        )}
      </div>


    </div>
  );
}
