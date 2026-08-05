"use client";

import { motion } from "framer-motion";
import {
  Check,
  PackageCheck,
  PackageOpen,
  Truck,
  XCircle,
  ExternalLink,
  Copy,
  Check as CheckIcon,
} from "lucide-react";
import { useState } from "react";

// ─── Types ──────────────────────────────────────────────────────────────────────

interface OrderTimelineProps {
  status: string;
  trackingId?: string | null;
  dispatchTimestamp?: string | null;
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

// Determine which steps are completed based on order status
function resolveProgress(status: string): number {
  switch (status) {
    case "Dispatched":
    case "Delivered":
      return 4;
    case "Packed":
      return 3;
    case "Pending Packing":
      return 2;
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
}: OrderTimelineProps) {
  const [copied, setCopied] = useState(false);

  const completed = resolveProgress(status);
  const isCancelled = status === "Cancelled";

  const steps: Step[] = [
    {
      id: "created",
      label: "Order Created",
      sub: "Order received and registered",
      icon: <PackageOpen size={14} />,
    },
    {
      id: "reserved",
      label: "Stock Reserved",
      sub: "Items reserved from your inbound inventory",
      icon: <PackageCheck size={14} />,
    },
    {
      id: "packed",
      label: "Packed by Owner",
      sub: "Warehouse owner packed the items",
      icon: <PackageCheck size={14} />,
    },
    {
      id: "dispatched",
      label: "Dispatched",
      sub: trackingId
        ? `Tracking ID: ${trackingId}`
        : dispatchTimestamp
          ? formatDateTime(dispatchTimestamp)
          : "Out for delivery",
      icon: <Truck size={14} />,
    },
  ];

  const copyTracking = async () => {
    if (!trackingId) return;
    try {
      await navigator.clipboard.writeText(trackingId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="relative pl-1">
      {/* Vertical rail */}
      <div className="absolute left-[15px] top-3 bottom-3 w-px bg-gradient-to-b from-[#84cc16]/50 via-neutral-800 to-neutral-800" />

      <div className="space-y-6">
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
                      In Progress
                    </span>
                  )}
                </p>

                {step.id === "dispatched" && trackingId ? (
                  <div className="mt-1 flex items-center gap-2">
                    <a
                      href={`https://www.google.com/search?q=${encodeURIComponent(trackingId)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-[#84cc16] font-body hover:underline group"
                      title="Search tracking ID"
                    >
                      <span className="font-mono">{trackingId}</span>
                      <ExternalLink size={11} className="opacity-60 group-hover:opacity-100 transition-opacity" />
                    </a>
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
                  </div>
                ) : (
                  <p className="mt-0.5 text-xs text-neutral-500 font-body">{step.sub}</p>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {isCancelled && (
        <div className="mt-5 flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-body">
          <XCircle size={14} className="shrink-0" />
          This order was cancelled and will not be fulfilled.
        </div>
      )}
    </div>
  );
}
