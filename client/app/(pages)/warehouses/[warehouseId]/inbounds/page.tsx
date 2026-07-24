"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Package,
  Loader2,
  AlertCircle,
  Clock,
  CheckCircle,
} from "lucide-react";
import { useAppSelector } from "@/redux/hooks";
import api from "@/lib/axios";

// ─── Types ──────────────────────────────────────────────────────────────────────

interface InboundBatch {
  _id: string;
  merchant: string;
  warehouse: string;
  booking: string;
  batchName: string;
  totalCartons: number;
  expectedDate: string;
  status: "in-transit" | "arrived" | "completed";
  createdAt: string;
  merchantName?: string;
}

// ─── Status Badge ───────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { bg: string; text: string; label: string }> = {
    "in-transit": { bg: "bg-blue-50 border-blue-200", text: "text-blue-700", label: "In Transit" },
    arrived: { bg: "bg-emerald-50 border-emerald-200", text: "text-emerald-700", label: "Arrived" },
    completed: { bg: "bg-slate-50 border-slate-200", text: "text-slate-700", label: "Completed" },
  };

  const c = config[status] || config["in-transit"];

  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-[11px] font-body font-medium ${c.bg} ${c.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${status === "in-transit" ? "bg-blue-500" : status === "arrived" ? "bg-emerald-500" : "bg-slate-500"}`} />
      {c.label}
    </span>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PAGE
// ═══════════════════════════════════════════════════════════════════════════════

export default function WarehouseInboundsPage() {
  const router = useRouter();
  const params = useParams();
  const warehouseId = params.warehouseId as string;
  const { accessToken } = useAppSelector((state) => state.auth);

  const [batches, setBatches] = useState<InboundBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // ─── Fetch inbound plans ──────────────────────────────────────────────────
  const fetchInbounds = useCallback(async () => {
    try {
      const res = await api.get(`/inbound/warehouse/${warehouseId}`);
      const data = res.data.data || [];
      setBatches(Array.isArray(data) ? data : []);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [warehouseId]);

  useEffect(() => {
    if (!accessToken || !warehouseId) return;
    fetchInbounds();
  }, [accessToken, warehouseId, fetchInbounds]);

  // ─── Computed stats ───────────────────────────────────────────────────────
  const totalBatches = batches.length;
  const totalCartonsPending = batches
    .filter((b) => b.status === "in-transit")
    .reduce((sum, b) => sum + b.totalCartons, 0);
  const arrivedBatches = batches.filter((b) => b.status === "arrived").length;

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-PK", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  // ─── Loading ─────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] pt-28 pb-20 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto animate-pulse space-y-6">
          <div className="h-6 bg-[#F8FAFC] rounded w-24" />
          <div className="grid grid-cols-3 gap-4">
            <div className="h-24 bg-[#F8FAFC] rounded-2xl" />
            <div className="h-24 bg-[#F8FAFC] rounded-2xl" />
            <div className="h-24 bg-[#F8FAFC] rounded-2xl" />
          </div>
          <div className="h-64 bg-[#F8FAFC] rounded-3xl" />
        </div>
      </div>
    );
  }

  // ─── Error ───────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] pt-28 pb-20 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto text-center py-20">
          <AlertCircle size={40} className="mx-auto text-[#0284C7]/40 mb-4" />
          <h2 className="font-heading text-xl font-semibold text-[#1E293B] mb-2">Failed to load inbound plans</h2>
          <p className="text-sm text-[#0F172A]/50 font-body mb-6">There was an error fetching inbound data for this warehouse.</p>
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#1E293B] text-white rounded-full font-body text-sm font-medium hover:bg-[#0284C7] transition-all duration-300"
          >
            <ArrowLeft size={16} />
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] pt-28 pb-20 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        {/* Back button */}
        <motion.button
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => router.back()}
          className="inline-flex items-center gap-1.5 text-sm text-[#0F172A]/50 hover:text-[#1E293B] font-body transition-colors mb-6"
        >
          <ArrowLeft size={16} />
          Back
        </motion.button>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8"
        >
          <h1 className="font-heading text-2xl sm:text-3xl font-bold text-[#1E293B] tracking-tight">
            Inbound Shipments
          </h1>
          <p className="mt-1 text-sm text-[#0F172A]/50 font-body">
            View all incoming inventory batches for this warehouse
          </p>
        </motion.div>

        {/* Summary Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.05 }}
          className="grid grid-cols-3 gap-4 mb-8"
        >
          <div className="bg-white rounded-2xl p-5 border border-[#E2E8F0] shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#F8FAFC] flex items-center justify-center">
                <Package size={20} className="text-[#0284C7]" />
              </div>
              <div>
                <p className="font-heading text-2xl font-bold text-[#1E293B] numeric">{totalBatches}</p>
                <p className="text-xs text-[#0F172A]/50 font-body">Total Batches</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-[#E2E8F0] shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#F8FAFC] flex items-center justify-center">
                <Clock size={20} className="text-[#0284C7]" />
              </div>
              <div>
                <p className="font-heading text-2xl font-bold text-[#1E293B] numeric">{totalCartonsPending}</p>
                <p className="text-xs text-[#0F172A]/50 font-body">Cartons Pending</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-[#E2E8F0] shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#F8FAFC] flex items-center justify-center">
                <CheckCircle size={20} className="text-[#0284C7]" />
              </div>
              <div>
                <p className="font-heading text-2xl font-bold text-[#1E293B] numeric">{arrivedBatches}</p>
                <p className="text-xs text-[#0F172A]/50 font-body">Arrived</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Inbound Batches Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-[#E2E8F0]"
        >
          <h2 className="font-heading text-xl font-semibold text-[#1E293B] mb-6">Incoming Batches</h2>

          {batches.length === 0 ? (
            <div className="text-center py-12">
              <Package size={32} className="mx-auto text-[#0284C7]/30 mb-3" />
              <p className="text-sm text-[#0F172A]/50 font-body">No inbound shipments found for this warehouse.</p>
            </div>
          ) : (
            <>
              {/* Table Header (desktop) */}
              <div className="hidden md:grid grid-cols-[2fr_1.5fr_1fr_1fr_1fr_0.5fr] gap-3 px-4 py-2.5 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] mb-1">
                <span className="text-[10px] font-semibold tracking-wider text-[#0F172A]/50 uppercase font-body">Batch Name</span>
                <span className="text-[10px] font-semibold tracking-wider text-[#0F172A]/50 uppercase font-body">Booking Ref</span>
                <span className="text-[10px] font-semibold tracking-wider text-[#0F172A]/50 uppercase font-body">Merchant</span>
                <span className="text-[10px] font-semibold tracking-wider text-[#0F172A]/50 uppercase font-body">Cartons</span>
                <span className="text-[10px] font-semibold tracking-wider text-[#0F172A]/50 uppercase font-body">Expected</span>
                <span className="text-[10px] font-semibold tracking-wider text-[#0F172A]/50 uppercase font-body">Status</span>
              </div>

              {/* Table Rows */}
              <div className="space-y-1.5">
                {batches.map((batch) => (
                  <div
                    key={batch._id}
                    onClick={() => router.push(`/my-bookings/${batch.booking}/inbound-plan/${batch._id}`)}
                    className="grid grid-cols-1 md:grid-cols-[2fr_1.5fr_1fr_1fr_1fr_0.5fr] gap-2 md:gap-3 items-center px-4 py-3.5 rounded-xl border border-[#E2E8F0] bg-white hover:bg-[#F8FAFC]/30 hover:border-[#0284C7]/30 transition-all duration-200 cursor-pointer"
                  >
                    {/* Batch Name */}
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-[#F8FAFC] flex items-center justify-center shrink-0">
                        <Package size={13} className="text-[#0284C7]" />
                      </div>
                      <span className="text-sm font-semibold text-[#1E293B] font-body truncate">{batch.batchName}</span>
                    </div>

                    {/* Booking Ref */}
                    <div className="text-xs text-[#0F172A]/60 font-body md:truncate">
                      <span className="md:hidden text-[10px] text-[#0F172A]/40 mr-1">Ref: </span>
                      {batch.booking?.slice(-8) || "—"}
                    </div>

                    {/* Merchant */}
                    <div className="text-xs text-[#0F172A]/60 font-body truncate">
                      <span className="md:hidden text-[10px] text-[#0F172A]/40 mr-1">Merchant: </span>
                      {batch.merchantName || batch.merchant?.slice(-8) || "—"}
                    </div>

                    {/* Cartons */}
                    <div className="text-sm font-semibold text-[#1E293B] font-body">
                      <span className="md:hidden text-[10px] text-[#0F172A]/40 mr-1">Cartons: </span>
                      {batch.totalCartons}
                    </div>

                    {/* Expected Date */}
                    <div className="text-xs text-[#0F172A]/60 font-body">
                      <span className="md:hidden text-[10px] text-[#0F172A]/40 mr-1">Expected: </span>
                      {formatDate(batch.expectedDate)}
                    </div>

                    {/* Status */}
                    <div className="flex justify-start md:justify-center">
                      <StatusBadge status={batch.status} />
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}
