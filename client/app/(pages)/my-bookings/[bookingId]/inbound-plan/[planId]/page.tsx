"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Package,
  CalendarDays,
  Loader2,
  AlertCircle,
  CheckCircle,
  X,
  Download,
  Printer,
  Info,
  Layers,
} from "lucide-react";
import { useAppSelector } from "@/redux/hooks";
import api from "@/lib/axios";
import { toDataURL } from "qrcode";
import jsPDF from "jspdf";

// ─── Types ──────────────────────────────────────────────────────────────────────

interface CartonData {
  _id: string;
  cartonCode: string;
  status: string;
  shelf?: string;
  createdAt: string;
}

interface PlanDetail {
  plan: {
    _id: string;
    batchName: string;
    totalCartons: number;
    expectedDate: string;
    status: string;
    warehouse?: string;
    booking?: string;
    createdAt: string;
  };
  cartons: CartonData[];
}

// ─── Instruction Modal ──────────────────────────────────────────────────────────

function PrintGuideModal({ onClose }: { onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-[#E2E8F0] overflow-hidden"
      >
        <div className="p-6 pb-4 border-b border-[#E2E8F0] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
              <Info size={20} className="text-amber-600" />
            </div>
            <h2 className="font-heading text-lg font-semibold text-[#1E293B]">
              Important: Labeling Your Inbound Cartons
            </h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-[#F8FAFC]/60 flex items-center justify-center text-[#0F172A]/50 hover:bg-[#F8FAFC] transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <ol className="space-y-4 text-sm font-body text-[#0F172A]/70">
            <li className="flex items-start gap-3">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#0284C7] text-white text-xs font-bold shrink-0 mt-0.5">1</span>
              <span><strong className="text-[#1E293B]">Print</strong> the downloaded PDF sheet containing all QR labels.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#0284C7] text-white text-xs font-bold shrink-0 mt-0.5">2</span>
              <span><strong className="text-[#1E293B]">Cut out</strong> each QR label code individually along the guidelines.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#0284C7] text-white text-xs font-bold shrink-0 mt-0.5">3</span>
              <span><strong className="text-[#1E293B]">Affix/tape</strong> each QR label firmly onto the corresponding outer box before shipping.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#0284C7] text-white text-xs font-bold shrink-0 mt-0.5">4</span>
              <span>Upon arrival at the warehouse, staff will <strong className="text-[#1E293B]">scan these labels</strong> for automated check-in and shelf assignment.</span>
            </li>
          </ol>

          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3">
            <Info size={16} className="text-amber-500 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700 font-body">
              Make sure each QR label is clearly visible and scannable. Damaged or missing labels may delay processing at the warehouse.
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-full py-3 bg-[#1E293B] text-white rounded-full text-sm font-body font-medium hover:bg-[#0284C7] transition-all duration-300"
          >
            Got it
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PAGE
// ═══════════════════════════════════════════════════════════════════════════════

export default function InboundPlanDetailPage() {
  const router = useRouter();
  const params = useParams();
  const bookingId = params.bookingId as string;
  const planId = params.planId as string;
  const { accessToken } = useAppSelector((state) => state.auth);

  const [detail, setDetail] = useState<PlanDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  // ─── Fetch plan details ──────────────────────────────────────────────────
  useEffect(() => {
    if (!accessToken || !planId) return;
    let cancelled = false;
    const fetchDetail = async () => {
      try {
        const res = await api.get(`/inbound/${planId}`);
        if (!cancelled) {
          setDetail(res.data.data);
        }
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchDetail();
    return () => { cancelled = true; };
  }, [accessToken, planId]);

  // ─── Generate QR PDF ─────────────────────────────────────────────────────
  const generateQRPdf = useCallback(async () => {
    if (!detail) return;
    setGeneratingPdf(true);
    try {
      const { cartons } = detail;
      const batchLabel = detail.plan.batchName.replace(/[^a-zA-Z0-9]/g, "_").slice(0, 20);
      const pdf = new jsPDF("p", "mm", "a4");
      const pageW = 210;
      const pageH = 297;
      const margin = 10;
      const cols = 3;
      const rows = 4;
      const cardW = (pageW - margin * 2) / cols;
      const cardH = (pageH - margin * 2) / rows;
      const qrSize = 28;

      for (let i = 0; i < cartons.length; i++) {
        const carton = cartons[i];
        const col = i % cols;
        const row = Math.floor(i % (cols * rows) / cols);

        // New page every 12 labels
        if (i > 0 && i % (cols * rows) === 0) {
          pdf.addPage();
        }

        const x = margin + col * cardW;
        const y = margin + row * cardH;

        // Card border
        pdf.setDrawColor(200, 200, 200);
        pdf.rect(x, y, cardW, cardH);

        // Generate QR code as data URL
        const qrDataUrl = await toDataURL(carton.cartonCode, {
          width: 200,
          margin: 1,
          color: { dark: "#1E293B", light: "#FFFFFF" },
        });

        // QR code image
        const qrX = x + (cardW - qrSize) / 2;
        const qrY = y + 3;
        pdf.addImage(qrDataUrl, "PNG", qrX, qrY, qrSize, qrSize);

        // Carton code text
        pdf.setFontSize(7);
        pdf.setTextColor(30, 41, 59);
        pdf.setFont("helvetica", "bold");
        const textX = x + cardW / 2;
        const textY = qrY + qrSize + 5;
        pdf.text(carton.cartonCode, textX, textY, { align: "center", maxWidth: cardW - 4 });

        // Batch name
        pdf.setFontSize(5.5);
        pdf.setTextColor(100, 116, 139);
        pdf.setFont("helvetica", "normal");
        pdf.text(detail.plan.batchName, textX, textY + 4, { align: "center", maxWidth: cardW - 4 });
      }

      pdf.save(`QR_Labels_${batchLabel}.pdf`);
      setShowGuide(true);
    } catch (err) {
      console.error("PDF generation failed", err);
    } finally {
      setGeneratingPdf(false);
    }
  }, [detail]);

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" });

  // ─── Loading ─────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] pt-28 pb-20 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto animate-pulse space-y-6">
          <div className="h-6 bg-[#F8FAFC] rounded w-24" />
          <div className="h-40 bg-[#F8FAFC] rounded-3xl" />
          <div className="h-64 bg-[#F8FAFC] rounded-3xl" />
        </div>
      </div>
    );
  }

  // ─── Error ───────────────────────────────────────────────────────────────
  if (error || !detail) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] pt-28 pb-20 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center py-20">
          <AlertCircle size={40} className="mx-auto text-[#0284C7]/40 mb-4" />
          <h2 className="font-heading text-xl font-semibold text-[#1E293B] mb-2">Inbound plan not found</h2>
          <p className="text-sm text-[#0F172A]/50 font-body mb-6">This plan may have been removed or you don&apos;t have access.</p>
          <button
            onClick={() => router.push(`/my-bookings/${bookingId}`)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#1E293B] text-white rounded-full font-body text-sm font-medium hover:bg-[#0284C7] transition-all duration-300"
          >
            <ArrowLeft size={16} />
            Back to Booking
          </button>
        </div>
      </div>
    );
  }

  const { plan, cartons } = detail;

  return (
    <div className="min-h-screen bg-[#F8FAFC] pt-28 pb-20 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        {/* Back button */}
        <motion.button
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => router.push(`/my-bookings/${bookingId}`)}
          className="inline-flex items-center gap-1.5 text-sm text-[#0F172A]/50 hover:text-[#1E293B] font-body transition-colors mb-6"
        >
          <ArrowLeft size={16} />
          Back to Booking
        </motion.button>

        {/* Plan Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-[#E2E8F0] mb-8"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#F8FAFC] flex items-center justify-center">
                <Package size={24} className="text-[#0284C7]" />
              </div>
              <div>
                <h1 className="font-heading text-2xl font-bold text-[#1E293B]">{plan.batchName}</h1>
                <p className="text-sm text-[#0F172A]/50 font-body">Inbound Plan</p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-body font-medium border ${
                plan.status === "in-transit"
                  ? "bg-blue-50 border-blue-200 text-blue-700"
                  : plan.status === "arrived"
                  ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                  : "bg-slate-50 border-slate-200 text-slate-700"
              }`}>
                {plan.status === "in-transit" ? "In Transit" : plan.status === "arrived" ? "Arrived" : "Completed"}
              </span>
            </div>
          </div>

          {/* Plan info grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
              <p className="text-[10px] font-semibold tracking-wider text-[#0F172A]/50 uppercase mb-1 font-body">Total Cartons</p>
              <p className="text-sm font-semibold text-[#1E293B] font-body">{plan.totalCartons}</p>
            </div>
            <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
              <p className="text-[10px] font-semibold tracking-wider text-[#0F172A]/50 uppercase mb-1 font-body">Expected</p>
              <p className="text-sm font-semibold text-[#1E293B] font-body">{formatDate(plan.expectedDate)}</p>
            </div>
            <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
              <p className="text-[10px] font-semibold tracking-wider text-[#0F172A]/50 uppercase mb-1 font-body">Status</p>
              <p className="text-sm font-semibold text-[#1E293B] font-body capitalize">{plan.status.replace("-", " ")}</p>
            </div>
            <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
              <p className="text-[10px] font-semibold tracking-wider text-[#0F172A]/50 uppercase mb-1 font-body">Cartons</p>
              <p className="text-sm font-semibold text-[#1E293B] font-body">{cartons?.length || 0} / {plan.totalCartons}</p>
            </div>
          </div>

          {/* QR PDF Download Button */}
          <button
            onClick={generateQRPdf}
            disabled={generatingPdf || !cartons || cartons.length === 0}
            className="w-full inline-flex items-center justify-center gap-2.5 px-6 py-3.5 bg-[#0284C7] text-white rounded-full font-body text-sm font-medium hover:bg-[#0284C7]/90 transition-all duration-300 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {generatingPdf ? (
              <><Loader2 size={18} className="animate-spin" />Generating PDF...</>
            ) : (
              <><Download size={18} />Download Carton QR Labels (PDF)</>
            )}
          </button>
        </motion.div>

        {/* Cartons List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-[#E2E8F0]"
        >
          <h2 className="font-heading text-xl font-semibold text-[#1E293B] mb-6">
            Cartons ({cartons?.length || 0})
          </h2>

          {!cartons || cartons.length === 0 ? (
            <div className="text-center py-12">
              <Layers size={32} className="mx-auto text-[#0284C7]/30 mb-3" />
              <p className="text-sm text-[#0F172A]/50 font-body">No cartons found for this plan.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Table header */}
              <div className="hidden sm:grid grid-cols-[1fr_1fr_100px] gap-3 px-4 py-2 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] text-[10px] font-semibold tracking-wider text-[#0F172A]/50 uppercase font-body">
                <span>Carton Code</span>
                <span>Status</span>
                <span>Shelf</span>
              </div>

              {cartons.map((carton) => (
                <div
                  key={carton._id}
                  className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_100px] gap-2 sm:gap-3 items-center px-4 py-3 rounded-xl border border-[#E2E8F0] bg-white hover:bg-[#F8FAFC]/30 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-[#F8FAFC] flex items-center justify-center">
                      <Package size={13} className="text-[#0284C7]" />
                    </div>
                    <span className="text-sm font-medium text-[#1E293B] font-body">{carton.cartonCode}</span>
                  </div>
                  <div>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-body font-medium border ${
                      carton.status === "arrived"
                        ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                        : carton.status === "in-transit"
                        ? "bg-blue-50 border-blue-200 text-blue-700"
                        : "bg-slate-50 border-slate-200 text-slate-700"
                    }`}>
                      {carton.status || "in-transit"}
                    </span>
                  </div>
                  <div className="text-sm text-[#0F172A]/60 font-body">
                    {carton.shelf || "—"}
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Print & Paste Guidance Modal */}
      <AnimatePresence>
        {showGuide && <PrintGuideModal onClose={() => setShowGuide(false)} />}
      </AnimatePresence>
    </div>
  );
}
