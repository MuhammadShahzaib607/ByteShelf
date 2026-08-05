"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  Check,
  PackageCheck,
  PackageOpen,
  Truck,
  XCircle,
  Copy,
  Check as CheckIcon,
  ChevronDown,
  MapPin,
  Clock,
} from "lucide-react";
import { useState } from "react";

// ─── Types ──────────────────────────────────────────────────────────────────────

export interface TimelineEntry {
  status: string;
  timestamp?: string;
  note?: string;
}

interface OrderTimelineProps {
  status: string;
  trackingId?: string | null;
  dispatchTimestamp?: string | null;
  courierDetails?: {
    courierName?: string;
    trackingId?: string;
    trackingUrl?: string;
  } | null;
  timeline?: TimelineEntry[] | null;
}

interface Step {
  id: string;
  label: string;
  sub: string;
  icon: React.ReactNode;
}

// ─── Helpers ────────────────────────────────────────────────────────────────────

function formatDateTime(d?: string | null): string {
  if (!d) return "";
  try {
    return new Date(d).toLocaleString("en-PK", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

// Determine how many steps are completed based on order status
function resolveProgress(status: string): number {
  switch (status) {
    case "Delivered":
      return 4;
    case "Dispatched":
    case "In Transit":
      return 3;
    case "Packed":
      return 2;
    case "Pending Packing":
      return 1;
    case "Cancelled":
      return 0;
    default:
      return 0;
  }
}

// ─── Component ──────────────────────────────────────────────────────────────────

export default function OrderTimeline({
  status,
  trackingId,
  dispatchTimestamp,
  courierDetails,
  timeline,
}: OrderTimelineProps) {
  const [copied, setCopied] = useState(false);
  const [showNotes, setShowNotes] = useState(false);

  const completed = resolveProgress(status);
  const isCancelled = status === "Cancelled";

  const courierName = courierDetails?.courierName || "";
  const courierTrackingId = courierDetails?.trackingId || trackingId || "";

  const steps: Step[] = [
    {
      id: "placed",
      label: "Order Placed",
      sub: "Order received and stock reserved",
      icon: <PackageOpen size={14} />,
    },
    {
      id: "packed",
      label: "Packed",
      sub: "Warehouse owner packed the items",
      icon: <PackageCheck size={14} />,
    },
    {
      id: "dispatched",
      label: "Dispatched",
      sub: courierName
        ? `Via ${courierName}${courierTrackingId ? ` · ${courierTrackingId}` : ""}`
        : courierTrackingId
          ? `Tracking: ${courierTrackingId}`
          : dispatchTimestamp
            ? formatDateTime(dispatchTimestamp)
            : "Out for delivery",
      icon: <Truck size={14} />,
    },
    {
      id: "delivered",
      label: "Delivered",
      sub: "Handed over to the customer",
      icon: <PackageCheck size={14} />,
    },
  ];

  const copyTracking = async () => {
    if (!courierTrackingId) return;
    try {
      await navigator.clipboard.writeText(courierTrackingId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  const sortedTimeline = Array.isArray(timeline)
    ? [...timeline].sort(
        (a, b) =>
          new Date(a.timestamp || 0).getTime() - new Date(b.timestamp || 0).getTime()
      )
    : [];

  return (
    <div className="relative pl-1">
      {/* Vertical rail */}
      <div className="absolute left-[15px] top-3 bottom-3 w-px bg-gradient-to-b from-[#84cc16]/50 via-neutral-800 to-neutral-800" />

      <div className="space-y-5">
        {steps.map((step, i) => {
          const done = completed > i;
          const isCurrent = !isCancelled && completed === i;
          const isLast = i === steps.length - 1;

          return (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: i * 0.08 }}
              className="relative flex items-start gap-4"
            >
              {/* Node */}
              <div className="relative z-10 shrink-0">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center border transition-all duration-300 ${
                    done
                      ? "bg-[#84cc16]/15 border-[#84cc16]/50 text-[#84cc16] shadow-[0_0_16px_rgba(132,204,22,0.25)]"
                      : isCurrent
                        ? "bg-[#1a231d] border-[#84cc16] text-[#84cc16] shadow-[0_0_18px_rgba(132,204,22,0.35)] animate-pulse"
                        : isCancelled
                          ? "bg-neutral-900 border-red-500/40 text-red-400/70"
                          : "bg-neutral-900 border-neutral-700 text-neutral-600"
                  }`}
                >
                  {done ? <Check size={15} strokeWidth={2.5} /> : step.icon}
                </div>
                {isCurrent && !isLast && (
                  <span className="absolute inset-0 rounded-full bg-[#84cc16]/20 animate-ping [animation-duration:2s]" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 pt-0.5">
                <p
                  className={`text-sm font-semibold font-body transition-colors ${
                    done || isCurrent
                      ? "text-white"
                      : isCancelled
                        ? "text-neutral-500"
                        : "text-neutral-500"
                  }`}
                >
                  {step.label}
                  {isCurrent && (
                    <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#84cc16]/10 border border-[#84cc16]/30 text-[#84cc16] text-[10px] font-semibold uppercase tracking-wider">
                      {status === "In Transit" ? "In Transit" : "In Progress"}
                    </span>
                  )}
                </p>

                {step.id === "dispatched" && courierTrackingId ? (
                  <div className="mt-1 flex items-center gap-2 flex-wrap">
                    <span className="inline-flex items-center gap-1.5 text-xs text-[#84cc16] font-body">
                      <span className="font-mono">{courierTrackingId}</span>
                    </span>
                    <button
                      type="button"
                      onClick={copyTracking}
                      title="Copy tracking ID"
                      className="p-1 rounded-md hover:bg-white/10 transition-colors"
                    >
                      {copied ? (
                        <CheckIcon size={11} className="text-[#84cc16]" />
                      ) : (
                        <Copy size={11} className="text-neutral-500 hover:text-neutral-300" />
                      )}
                    </button>
                    {sortedTimeline.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setShowNotes((v) => !v)}
                        className="inline-flex items-center gap-1 text-[11px] text-neutral-400 hover:text-white font-body transition-colors"
                      >
                        <ChevronDown size={11} className={`transition-transform ${showNotes ? "rotate-180" : ""}`} />
                        Delivery notes
                      </button>
                    )}
                  </div>
                ) : (
                  <p className="mt-0.5 text-xs text-neutral-500 font-body">{step.sub}</p>
                )}

                {step.id === "dispatched" && courierName && (
                  <p className="mt-1 inline-flex items-center gap-1 text-[11px] text-neutral-400 font-body">
                    <Truck size={10} className="text-neutral-500" />
                    {courierName}
                  </p>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Full delivery notes / timeline */}
      <AnimatePresence>
        {showNotes && sortedTimeline.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="mt-4 ml-12 rounded-xl bg-neutral-900/80 border border-neutral-800 p-3 space-y-2">
              <p className="text-[10px] font-semibold tracking-wider text-neutral-500 uppercase font-body">
                Full delivery notes
              </p>
              {sortedTimeline.map((entry, idx) => (
                <div key={idx} className="flex items-start gap-2 text-xs font-body">
                  <Clock size={11} className="text-[#84cc16] shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-white font-medium">
                      {entry.status}
                      {entry.timestamp && (
                        <span className="text-neutral-500 font-normal ml-1.5">
                          {formatDateTime(entry.timestamp)}
                        </span>
                      )}
                    </p>
                    {entry.note && (
                      <p className="text-neutral-400 mt-0.5">{entry.note}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {isCancelled && (
        <div className="mt-5 flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-body">
          <XCircle size={14} className="shrink-0" />
          This order was cancelled and will not be fulfilled.
        </div>
      )}

      {/* Delivered milestone marker */}
      {!isCancelled && status === "Delivered" && (
        <div className="mt-4 ml-12 flex items-center gap-2 px-3 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-body">
          <MapPin size={13} className="shrink-0" />
          Delivered to the customer
        </div>
      )}
    </div>
  );
}
