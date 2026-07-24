"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Warehouse,
  Layers,
  Plus,
  Edit3,
  Eye,
  MapPin,
} from "lucide-react";
import { useAppSelector } from "@/redux/hooks";
import api from "@/lib/axios";
import ImageCarousel from "@/components/ui/ImageCarousel";
import AddShelvesModal from "@/components/ui/AddShelvesModal";

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

interface MyWarehousesResponse {
  warehouses: WarehouseData[];
  totalWarehouses: number;
  totalShelves: number;
}

// ─── Skeleton Card ──────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-[#0284C7]/10 animate-pulse">
      <div className="h-44 bg-[#F8FAFC]" />
      <div className="p-5 space-y-3">
        <div className="h-5 bg-[#F8FAFC] rounded w-3/4" />
        <div className="h-3 bg-[#F8FAFC] rounded w-1/2" />
        <div className="flex justify-between pt-2">
          <div className="h-6 bg-[#F8FAFC] rounded w-1/3" />
          <div className="h-4 bg-[#F8FAFC] rounded w-1/4" />
        </div>
        <div className="flex gap-2 pt-1">
          <div className="h-9 bg-[#F8FAFC] rounded-full w-1/2" />
          <div className="h-9 bg-[#F8FAFC] rounded-full w-1/2" />
        </div>
      </div>
    </div>
  );
}

// ─── Image Carousel (inline) ────────────────────────────────────────────────────

function WarehouseImage({
  images,
  name,
}: {
  images: string[];
  name: string;
}) {
  return <ImageCarousel images={images} alt={name} />;
}

// ═══════════════════════════════════════════════════════════════════════════════
// PAGE
// ═══════════════════════════════════════════════════════════════════════════════

export default function MyWarehousesPage() {
  const router = useRouter();
  const { accessToken, user, isCheckingAuth } = useAppSelector(
    (state) => state.auth
  );

  const [warehouses, setWarehouses] = useState<WarehouseData[]>([]);
  const [totalWarehouses, setTotalWarehouses] = useState(0);
  const [totalShelves, setTotalShelves] = useState(0);
  const [loading, setLoading] = useState(true);

  // ─── Add Shelves state ──────────────────────────────────────────────
  const [addShelvesTarget, setAddShelvesTarget] = useState<{
    id: string;
    name: string;
    pricePerShelf: number;
    totalShelves: number;
  } | null>(null);

  // ─── Refetch data after shelf addition or mutation ──────────────────────
  const refetchWarehouses = useCallback(async () => {
    if (!accessToken || user?.role !== "warehouseOwner") return;
    try {
      const res = await api.get("/warehouse/my-warehouses");
      const data: MyWarehousesResponse = res.data.data;
      setWarehouses(data.warehouses || []);
      setTotalWarehouses(data.totalWarehouses || 0);
      setTotalShelves(data.totalShelves || 0);
    } catch {
      // handled
    }
  }, [accessToken]);

  // Auth + Role guard
  useEffect(() => {
    if (isCheckingAuth) return;
    if (!accessToken) {
      router.replace("/login");
      return;
    }
    if (user?.role !== "warehouseOwner") {
      router.replace("/explore");
    }
  }, [accessToken, user, isCheckingAuth, router]);

  // Fetch my warehouses
  useEffect(() => {
    if (!accessToken || user?.role !== "warehouseOwner") return;
    let cancelled = false;
    const fetchData = async () => {
      try {
        const res = await api.get("/warehouse/my-warehouses");
        const data: MyWarehousesResponse = res.data.data;
        if (!cancelled) {
          setWarehouses(data.warehouses || []);
          setTotalWarehouses(data.totalWarehouses || 0);
          setTotalShelves(data.totalShelves || 0);
        }
      } catch {
        // handled
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchData();
    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] pt-28 pb-20 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8"
        >
          <div>
            <h1 className="font-heading text-2xl sm:text-3xl font-bold text-[#1E293B] tracking-tight">
              My Warehouses
            </h1>
            <p className="mt-1 text-sm text-[#0F172A]/50 font-body">
              Manage your listed warehouse spaces
            </p>
          </div>
          <Link
            href="/warehouses/add"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1E293B] text-white rounded-full font-body text-sm font-medium hover:bg-[#0284C7] transition-all duration-300 shadow-sm hover:shadow-md active:scale-[0.98]"
          >
            <Plus size={16} />
            Add Warehouse
          </Link>
        </motion.div>

        {/* Metric Cards */}
        {!loading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="grid grid-cols-2 gap-4 mb-8"
          >
            <div className="bg-white rounded-2xl p-5 border border-[#0284C7]/10 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#F8FAFC] flex items-center justify-center">
                  <Warehouse size={20} className="text-[#0284C7]" />
                </div>
                <div>
                  <p className="font-heading text-2xl font-bold text-[#1E293B] numeric">
                    {totalWarehouses}
                  </p>
                  <p className="text-xs text-[#0F172A]/50 font-body">
                    Total Warehouses
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-[#0284C7]/10 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#F8FAFC] flex items-center justify-center">
                  <Layers size={20} className="text-[#0284C7]" />
                </div>
                <div>
                  <p className="font-heading text-2xl font-bold text-[#1E293B] numeric">
                    {totalShelves}
                  </p>
                  <p className="text-xs text-[#0F172A]/50 font-body">
                    Total Shelves
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Loading */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        )}

        {/* Empty */}
        {!loading && warehouses.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center mx-auto mb-4 shadow-sm">
              <Warehouse size={28} className="text-[#0284C7]/40" />
            </div>
            <h3 className="font-heading text-lg font-semibold text-[#1E293B] mb-2">
              No warehouses yet
            </h3>
            <p className="text-sm text-[#0F172A]/50 font-body mb-6 max-w-sm mx-auto">
              List your first warehouse space to start earning from unused
              capacity.
            </p>
            <Link
              href="/warehouses/add"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#1E293B] text-white rounded-full font-body text-sm font-medium hover:bg-[#0284C7] transition-all duration-300"
            >
              <Plus size={16} />
              Add Your First Warehouse
            </Link>
          </motion.div>
        )}

        {/* Warehouse Grid */}
        {!loading && warehouses.length > 0 && (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: { staggerChildren: 0.08, delayChildren: 0.1 },
              },
            }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {warehouses.map((w, i) => (
              <motion.div
                key={w._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 hover:-translate-y-1 border border-[#0284C7]/10 flex flex-col"
              >
                <WarehouseImage images={w.images} name={w.name} />

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
                        Rs. {w.pricePerShelf}
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

                  {/* Actions */}
                  <div className="mt-4 flex items-center gap-2">
                    <button
                      onClick={() => router.push(`/warehouses/${w._id}`)}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 border border-[#0284C7]/30 text-[#0284C7] rounded-full text-xs font-body font-medium hover:bg-[#F8FAFC]/40 transition-colors"
                    >
                      <Eye size={14} />
                      View Details
                    </button>
                    <Link
                      href={`/warehouses/edit/${w._id}`}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-[#1E293B] text-white rounded-full text-xs font-body font-medium hover:bg-[#0284C7] transition-all duration-300"
                    >
                      <Edit3 size={14} />
                      Edit
                    </Link>
                    <button
                      onClick={() =>
                        setAddShelvesTarget({
                          id: w._id,
                          name: w.name,
                          pricePerShelf: w.pricePerShelf,
                          totalShelves: w.totalShelves,
                        })
                      }
                      className="flex items-center justify-center gap-1 px-3 py-2 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-full text-xs font-body font-medium hover:bg-emerald-100 transition-colors"
                    >
                      <Plus size={14} />
                      Shelves
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      {/* Add Shelves Modal */}
      <AnimatePresence>
        {addShelvesTarget && (
          <AddShelvesModal
            warehouseId={addShelvesTarget.id}
            warehouseName={addShelvesTarget.name}
            pricePerShelf={addShelvesTarget.pricePerShelf}
            totalShelves={addShelvesTarget.totalShelves}
            onClose={() => setAddShelvesTarget(null)}
            onSuccess={refetchWarehouses}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
