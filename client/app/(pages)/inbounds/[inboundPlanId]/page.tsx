"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Package,
  CalendarDays,
  AlertCircle,
  CheckCircle,
  Clock,
  Layers,
  Box,
  Hash,
} from "lucide-react";
import { useAppSelector } from "@/redux/hooks";
import api from "@/lib/axios";

// ─── Types ──────────────────────────────────────────────────────────────────────

interface CartonData {
  _id: string;
  cartonCode: string;
  status: "in-transit" | "arrived" | "stored";
  shelf?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface PlanDetail {
  plan: {
    _id: string;
    batchName: string;
    totalCartons: number;
    expectedDate: string;
    status: "in-transit" | "arrived" | "completed";
    warehouse?: string;
    booking?: string;
    createdAt: string;
    updatedAt: string;
  };
  cartons: CartonData[];
}

// ─── Helpers ────────────────────────────────────────────────────────────────────

function formatDate(d: string): string {
  return new Date(d).toLocaleDateString("en-PK", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(d: string): string {
  return new Date(d).toLocaleString("en-PK", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statusBadgeClasses(status: string): string {
  switch (status) {
    case "in-transit":
      return "bg-amber-50 border-amber-200 text-amber-700";
    case "arrived":
      return "bg-blue-50 border-blue-200 text-blue-700";
    case "completed":
      return "bg-emerald-50 border-emerald-200 text-emerald-700";
    case "stored":
      return "bg-emerald-50 border-emerald-200 text-emerald-700";
    default:
      return "bg-slate-50 border-slate-200 text-slate-600";
  }
}

function statusIcon(status: string) {
  switch (status) {
    case "in-transit":
      return <Clock size={10} />;
    case "arrived":
      return <CheckCircle size={10} />;
    case "completed":
      return <CheckCircle size={10} />;
    case "stored":
      return <CheckCircle size={10} />;
    default:
      return <Clock size={10} />;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// PAGE
// ═══════════════════════════════════════════════════════════════════════════════

export default function InboundDetailPage() {
  const router = useRouter();
  const params = useParams();
  const inboundPlanId = params.inboundPlanId as string;
  const { accessToken, isCheckingAuth } = useAppSelector(
    (state) => state.auth
  );

  const [detail, setDetail] = useState<PlanDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);

  // ─── Auth guard ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (isCheckingAuth) return;
    if (!accessToken) router.replace("/login");
  }, [accessToken, isCheckingAuth, router]);

  // ─── Fetch plan details ──────────────────────────────────────────────────
  useEffect(() => {
    if (!accessToken || !inboundPlanId) return;
    let cancelled = false;
    const fetchDetail = async () => {
      try {
        const res = await api.get(`/inbound/${inboundPlanId}`);
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
    return () => {
      cancelled = true;
    };
  }, [accessToken, inboundPlanId]);

  // ─── Loading ─────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] pt-28 pb-20 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto animate-pulse space-y-6">
          <div className="h-6 bg-white/60 rounded w-24" />
          <div className="h-44 bg-white rounded-3xl border border-[#E2E8F0] p-8">
            <div className="h-7 bg-[#F8FAFC] rounded-lg w-48 mb-6" />
            <div className="grid grid-cols-4 gap-4">
              <div className="h-16 bg-[#F8FAFC] rounded-xl" />
              <div className="h-16 bg-[#F8FAFC] rounded-xl" />
              <div className="h-16 bg-[#F8FAFC] rounded-xl" />
              <div className="h-16 bg-[#F8FAFC] rounded-xl" />
            </div>
          </div>
          <div className="h-64 bg-white rounded-3xl border border-[#E2E8F0]" />
        </div>
      </div>
    );
  }

  // ─── Error ───────────────────────────────────────────────────────────────
  if (fetchError || !detail) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] pt-28 pb-20 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center py-20">
          <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center mx-auto mb-4 border border-[#E2E8F0] shadow-sm">
            <AlertCircle size={28} className="text-red-400" />
          </div>
          <h2 className="font-heading text-xl font-semibold text-[#1E293B] mb-2">
            Inbound plan not found
          </h2>
          <p className="text-sm text-[#0F172A]/50 font-body mb-6">
            This inbound plan may have been removed or you don&apos;t have
            access to it.
          </p>
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

  const { plan, cartons } = detail;
  const arrivedCount = cartons.filter((c) => c.status === "arrived" || c.status === "stored").length;
  const inTransitCount = cartons.filter((c) => c.status === "in-transit").length;
  const storedCount = cartons.filter((c) => c.status === "stored").length;

  return (
    <div className="min-h-screen bg-[#F8FAFC] pt-28 pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Back Button */}
        <motion.button
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => router.back()}
          className="inline-flex items-center gap-1.5 text-sm text-[#0F172A]/50 hover:text-[#1E293B] font-body transition-colors mb-6"
        >
          <ArrowLeft size={16} />
          Back
        </motion.button>

        {/* ═══ HEADER CARD ═══ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-[#E2E8F0] mb-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#F8FAFC] flex items-center justify-center">
                <Package size={24} className="text-[#0284C7]" />
              </div>
              <div>
                <h1 className="font-heading text-2xl font-bold text-[#1E293B]">
                  {plan.batchName}
                </h1>
                <p className="text-sm text-[#0F172A]/50 font-body">
                  Inbound Plan Details
                </p>
              </div>
            </div>
            <span
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-body font-medium border shrink-0 ${statusBadgeClasses(plan.status)}`}
            >
              {statusIcon(plan.status)}
              {plan.status === "in-transit"
                ? "In Transit"
                : plan.status === "arrived"
                  ? "Arrived"
                  : "Completed"}
            </span>
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
              <div className="flex items-center gap-2 mb-1">
                <Hash size={13} className="text-[#0284C7]" />
                <p className="text-[10px] font-semibold tracking-wider text-[#0F172A]/50 uppercase font-body">
                  Total Cartons
                </p>
              </div>
              <p className="text-lg font-bold text-[#1E293B] font-body numeric">
                {plan.totalCartons}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
              <div className="flex items-center gap-2 mb-1">
                <CalendarDays size={13} className="text-[#0284C7]" />
                <p className="text-[10px] font-semibold tracking-wider text-[#0F172A]/50 uppercase font-body">
                  Expected
                </p>
              </div>
              <p className="text-sm font-semibold text-[#1E293B] font-body">
                {formatDate(plan.expectedDate)}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
              <div className="flex items-center gap-2 mb-1">
                <Package size={13} className="text-[#0284C7]" />
                <p className="text-[10px] font-semibold tracking-wider text-[#0F172A]/50 uppercase font-body">
                  Created
                </p>
              </div>
              <p className="text-sm font-semibold text-[#1E293B] font-body">
                {formatDate(plan.createdAt)}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
              <div className="flex items-center gap-2 mb-1">
                <Clock size={13} className="text-[#0284C7]" />
                <p className="text-[10px] font-semibold tracking-wider text-[#0F172A]/50 uppercase font-body">
                  Status
                </p>
              </div>
              <p className="text-sm font-semibold text-[#1E293B] font-body capitalize">
                {plan.status.replace("-", " ")}
              </p>
            </div>
          </div>
        </motion.div>

        {/* ═══ CARTON STATUS SUMMARY ═══ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.08 }}
          className="grid grid-cols-3 gap-4 mb-6"
        >
          <div className="p-4 rounded-2xl bg-white border border-[#E2E8F0] text-center shadow-sm">
            <Box size={18} className="mx-auto text-[#0284C7] mb-1.5" />
            <p className="text-lg font-bold text-[#1E293B] font-body numeric">
              {cartons.length}
            </p>
            <p className="text-[10px] text-[#0F172A]/50 font-body uppercase tracking-wider">
              Total
            </p>
          </div>
          <div className="p-4 rounded-2xl bg-white border border-[#E2E8F0] text-center shadow-sm">
            <div className="w-[18px] h-[18px] rounded-full bg-amber-400 mx-auto mb-1.5" />
            <p className="text-lg font-bold text-[#1E293B] font-body numeric">
              {inTransitCount}
            </p>
            <p className="text-[10px] text-[#0F172A]/50 font-body uppercase tracking-wider">
              In Transit
            </p>
          </div>
          <div className="p-4 rounded-2xl bg-white border border-[#E2E8F0] text-center shadow-sm">
            <div className="w-[18px] h-[18px] rounded-full bg-emerald-400 mx-auto mb-1.5" />
            <p className="text-lg font-bold text-[#1E293B] font-body numeric">
              {arrivedCount}
            </p>
            <p className="text-[10px] text-[#0F172A]/50 font-body uppercase tracking-wider">
              Arrived
            </p>
          </div>
        </motion.div>

        {/* ═══ CARTONS TABLE ═══ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-[#E2E8F0]"
        >
          <h2 className="font-heading text-xl font-semibold text-[#1E293B] mb-6">
            Cartons &amp; Items
          </h2>

          {!cartons || cartons.length === 0 ? (
            <div className="text-center py-12">
              <Layers size={32} className="mx-auto text-[#0284C7]/30 mb-3" />
              <p className="text-sm text-[#0F172A]/50 font-body">
                No cartons found for this inbound plan.
              </p>
            </div>
          ) : (
            <>
              {/* Table Header */}
              <div className="hidden sm:grid grid-cols-[1fr_100px_110px_100px] gap-3 px-4 py-2.5 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] mb-1">
                <span className="text-[10px] font-semibold tracking-wider text-[#0F172A]/50 uppercase font-body">
                  Carton Code
                </span>
                <span className="text-[10px] font-semibold tracking-wider text-[#0F172A]/50 uppercase font-body">
                  Status
                </span>
                <span className="text-[10px] font-semibold tracking-wider text-[#0F172A]/50 uppercase font-body">
                  Shelf
                </span>
                <span className="text-[10px] font-semibold tracking-wider text-[#0F172A]/50 uppercase font-body">
                  Created
                </span>
              </div>

              {/* Table Rows */}
              <div className="space-y-1">
                {cartons.map((carton) => (
                  <div
                    key={carton._id}
                    className="grid grid-cols-[1fr_100px_110px_100px] gap-3 items-center px-4 py-3 rounded-xl border border-[#E2E8F0] bg-white hover:bg-[#F8FAFC]/40 transition-colors duration-200"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-[#F8FAFC] flex items-center justify-center shrink-0">
                        <Box size={13} className="text-[#0284C7]" />
                      </div>
                      <span className="text-sm font-medium text-[#1E293B] font-body truncate">
                        {carton.cartonCode}
                      </span>
                    </div>
                    <div>
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-body font-medium border ${statusBadgeClasses(carton.status)}`}
                      >
                        {statusIcon(carton.status)}
                        {carton.status === "in-transit"
                          ? "In Transit"
                          : carton.status === "arrived"
                            ? "Arrived"
                            : "Stored"}
                      </span>
                    </div>
                    <div className="text-sm text-[#0F172A]/60 font-body">
                      {carton.shelf || "—"}
                    </div>
                    <div className="text-xs text-[#0F172A]/40 font-body">
                      {formatDateTime(carton.createdAt)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer summary */}
              <div className="mt-4 pt-4 border-t border-[#E2E8F0] flex items-center justify-between text-xs text-[#0F172A]/40 font-body">
                <span>
                  {cartons.length} of {plan.totalCartons} carton
                  {plan.totalCartons !== 1 ? "s" : ""}
                </span>
                <span>
                  {storedCount > 0
                    ? `${storedCount} stored`
                    : arrivedCount > 0
                      ? `${arrivedCount} arrived`
                      : "All in transit"}
                </span>
              </div>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}
