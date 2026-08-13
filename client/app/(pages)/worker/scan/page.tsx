"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Scan,
  ArrowLeft,
  Camera,
  Smartphone,
  Loader2,
  CheckCircle2,
  XCircle,
  Barcode,
  Zap,
  X,
  RefreshCw,
} from "lucide-react";
import { useAppSelector } from "@/redux/hooks";
import api from "@/lib/axios";
import CartonQRScanner from "@/components/ui/CartonQRScanner";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface ScanResult {
  cartonCode: string;
  status: string;
  message: string;
  planId?: string;
}

// ─── Sound feedback using Web Audio API ────────────────────────────────────────

function playBeep(frequency: number, duration: number) {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(frequency, ctx.currentTime);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch {
    // Audio not available — silently continue
  }
}

function vibrate(duration: number) {
  try {
    if (navigator.vibrate) {
      navigator.vibrate(duration);
    }
  } catch {
    // Vibration not available
  }
}

// ─── Mobile detection ──────────────────────────────────────────────────────────

function isMobileViewport(): boolean {
  if (typeof window === "undefined") return true;
  // Consider mobile if width < 768px (Tailwind's md breakpoint)
  return window.innerWidth < 768;
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════════

export default function WorkerScanPage() {
  const router = useRouter();
  const { accessToken, user, isCheckingAuth } = useAppSelector(
    (state) => state.auth
  );

  const [isMobile, setIsMobile] = useState(true);
  const [scannerReady, setScannerReady] = useState(false);
  const [isScanning, setIsScanning] = useState(true);
  const [manualCode, setManualCode] = useState("");
  const [scanning, setScanning] = useState(false);
  const [lastResult, setLastResult] = useState<ScanResult | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scanHistory, setScanHistory] = useState<ScanResult[]>([]);

  const [retryCounter, setRetryCounter] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // ─── Role guard ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (isCheckingAuth) return;
    if (!accessToken) {
      router.replace("/login");
      return;
    }
    if (user && user.role !== "worker") {
      router.replace("/");
    }
  }, [accessToken, user, isCheckingAuth, router]);

  // ─── Mobile viewport detection ───────────────────────────────────────────
  useEffect(() => {
    setIsMobile(isMobileViewport());
    const onResize = () => setIsMobile(isMobileViewport());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // ─── Handle scan result (dedup is enforced by CartonQRScanner + `active`) ─
  const handleScanResult = useCallback(
    async (code: string) => {
      if (!code) return;

      setScanning(true);
      setIsScanning(false);
      setScanError(null);
      setLastResult(null);

      try {
        const res = await api.post("/carton/scan", { cartonCode: code });
        const data = res.data;

        if (data.success) {
          // Play success beep + vibrate
          playBeep(880, 0.3);
          vibrate(200);

          const result: ScanResult = {
            cartonCode: data.carton?.cartonCode || code,
            status: data.carton?.status || "arrived",
            message: data.message || "Carton scanned successfully",
            planId: data.carton?.inboundPlan,
          };
          setLastResult(result);
          setScanHistory((prev) => [result, ...prev].slice(0, 50));
          setManualCode("");

          // Auto re-enable scanner after 1.5s (CartonQRScanner resumes via `active`)
          setTimeout(() => {
            setLastResult(null);
            setScanError(null);
            setIsScanning(true);
            setScanning(false);
          }, 1500);
        } else {
          throw new Error(data.message || "Scan failed");
        }
      } catch (err: any) {
        const msg =
          err?.response?.data?.message ||
          err?.message ||
          "Something went wrong during scan";
        setScanError(msg);

        playBeep(220, 0.4);
        vibrate(400);

        // Auto re-enable after error delay (CartonQRScanner resumes via `active`)
        setTimeout(() => {
          setScanError(null);
          setIsScanning(true);
          setScanning(false);
        }, 2500);
      }
    },
    []
  );

  // ─── Manual submit ──────────────────────────────────────────────────────
  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    await handleScanResult(manualCode.trim());
    setManualCode("");
  };

  // ─── Retry camera ───────────────────────────────────────────────────────
  const handleRetryCamera = () => {
    setCameraError(null);
    setScannerReady(false);
    setRetryCounter((c) => c + 1);
  };

  // ─── Clear last result ──────────────────────────────────────────────────
  const handleDismissResult = () => {
    setLastResult(null);
    setIsScanning(true);
    setScanning(false);
  };

  // ─── Loading state ──────────────────────────────────────────────────────
  if (isCheckingAuth) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-white">
        <Loader2 size={32} className="animate-spin text-[#0284C7]" />
      </div>
    );
  }

  // ─── Desktop fallback ──────────────────────────────────────────────────
  if (!isMobile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white px-6">
        <div className="max-w-sm w-full text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-[#1E293B]/5 flex items-center justify-center">
            <Smartphone size={40} className="text-[#1E293B]/40" />
          </div>
          <h1 className="text-xl font-heading font-semibold text-[#1E293B] mb-3">
            Mobile Scanner Only
          </h1>
          <p className="text-sm text-[#0F172A]/60 font-body leading-relaxed mb-6">
            This Scanner feature is optimized for mobile handheld devices only.
            Please open on a mobile phone.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium bg-slate-900 text-white hover:bg-slate-800 hover:shadow-lg hover:shadow-slate-900/20 active:scale-95 transition-all duration-200"
          >
            <ArrowLeft size={16} />
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  // ─── Main scanner UI ───────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#0F172A] flex flex-col">
      {/* ─── Header ─────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-20 bg-[#1E293B]/90 backdrop-blur-lg border-b border-white/5 px-4 py-3 flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2 text-white/70 hover:text-white transition-colors"
        >
          <ArrowLeft size={20} />
          <span className="text-sm font-body">Back</span>
        </Link>
        <div className="flex items-center gap-2">
          <Scan size={18} className="text-[#0284C7]" />
          <span className="text-sm font-semibold text-white font-body">
            Scan Cartons
          </span>
        </div>
        <div className="w-16" /> {/* Spacer */}
      </header>

      {/* ─── Camera Scanner Viewport ────────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center px-4 pt-4 pb-2">
        {cameraError ? (
          /* ── Camera error state ─────────────────────────────────── */
          <div className="w-full flex-1 flex flex-col items-center justify-center rounded-2xl bg-[#1E293B]/60 border border-white/5 p-8">
            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
              <Camera size={28} className="text-red-400" />
            </div>
            <p className="text-sm text-white/80 font-body text-center mb-4">
              {cameraError}
            </p>
            <button
              onClick={handleRetryCamera}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium bg-[#0284C7] text-white hover:bg-[#0369a1] transition-colors"
            >
              <RefreshCw size={16} />
              Retry Camera
            </button>
          </div>
        ) : !scannerReady ? (
          /* ── Scanner loading ─────────────────────────────────────── */
          <div className="w-full flex-1 flex flex-col items-center justify-center rounded-2xl bg-[#1E293B]/60 border border-white/5">
            <Loader2 size={32} className="animate-spin text-[#0284C7] mb-3" />
            <p className="text-xs text-white/50 font-body">Starting camera...</p>
          </div>
        ) : null}

        {/* ── Camera feed div is ALWAYS in DOM (hidden when not ready) ── */}
        <div
          className={`relative w-full flex-1 rounded-2xl overflow-hidden bg-black border-2 border-[#0284C7]/30 shadow-lg shadow-[#0284C7]/10 ${
            cameraError || !scannerReady ? "hidden" : ""
          }`}
        >
          <CartonQRScanner
            key={retryCounter}
            elementId="byteshelf-scanner"
            className="w-full h-full"
            active={isScanning}
            onScanSuccess={handleScanResult}
            onCameraReady={() => setScannerReady(true)}
            onCameraError={(msg) => setCameraError(msg)}
          />

          {/* Scanning overlay frame */}
          <div className="absolute inset-0 pointer-events-none">
            {/* Corner brackets */}
            <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-[#0284C7]/70 rounded-tl" />
            <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-[#0284C7]/70 rounded-tr" />
            <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-[#0284C7]/70 rounded-bl" />
            <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-[#0284C7]/70 rounded-br" />
          </div>

          {/* Scanning animation line */}
          {isScanning && (
            <motion.div
              className="absolute left-[15%] right-[15%] h-[2px] bg-[#0284C7]/60 shadow-[0_0_8px_rgba(2,132,199,0.5)] pointer-events-none"
              animate={{
                top: ["20%", "80%", "20%"],
              }}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          )}

          {/* Status indicator */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 pointer-events-none">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-sm">
              <div
                className={`w-2 h-2 rounded-full ${
                  isScanning ? "bg-emerald-400 animate-pulse" : "bg-amber-400"
                }`}
              />
              <span className="text-[11px] text-white/70 font-body">
                {isScanning ? "Ready to scan" : "Processing..."}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Scan Result / Error Badge ─────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {lastResult && (
          <motion.div
            key="success"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="mx-4 mb-2"
          >
            <div className="flex items-start gap-3 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 size={22} className="text-emerald-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white font-body">
                  Carton #{lastResult.cartonCode} Scanned Successfully
                </p>
                <p className="text-xs text-white/60 font-body mt-0.5">
                  Status: {lastResult.status}
                </p>
                {lastResult.planId && (
                  <p className="text-xs text-white/40 font-body mt-0.5 truncate">
                    Plan: {lastResult.planId}
                  </p>
                )}
              </div>
              <button
                onClick={handleDismissResult}
                className="w-7 h-7 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors flex-shrink-0"
              >
                <X size={14} className="text-white/50" />
              </button>
            </div>
          </motion.div>
        )}

        {scanError && !lastResult && (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="mx-4 mb-2"
          >
            <div className="flex items-start gap-3 p-4 rounded-2xl bg-red-500/10 border border-red-500/20">
              <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
                <XCircle size={22} className="text-red-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white font-body">
                  Scan Failed
                </p>
                <p className="text-xs text-white/60 font-body mt-0.5">
                  {scanError}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Manual Input Fallback ─────────────────────────────────────── */}
      <div className="px-4 pb-3 pt-1">
        <form onSubmit={handleManualSubmit} className="flex items-center gap-2">
          <div className="flex-1 relative">
            <Barcode
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30"
            />
            <input
              ref={inputRef}
              type="text"
              placeholder="Enter barcode manually..."
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              disabled={scanning}
              className="w-full pl-9 pr-3 py-3 rounded-full text-sm font-body bg-[#1E293B] border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-[#0284C7]/50 focus:ring-1 focus:ring-[#0284C7]/30 transition-all"
            />
          </div>
          <button
            type="submit"
            disabled={!manualCode.trim() || scanning}
            className="flex items-center gap-1.5 px-5 py-3 rounded-full text-sm font-medium bg-[#0284C7] text-white hover:bg-[#0369a1] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            <Zap size={16} />
            Submit
          </button>
        </form>
      </div>

      {/* ─── Scan History ──────────────────────────────────────────────── */}
      {scanHistory.length > 0 && (
        <div className="px-4 pb-6">
          <div className="flex items-center justify-between mb-2.5">
            <h3 className="text-xs font-semibold text-white/50 font-body uppercase tracking-wider">
              Recent Scans ({scanHistory.length})
            </h3>
            <button
              onClick={() => setScanHistory([])}
              className="text-[11px] text-white/30 hover:text-white/60 font-body transition-colors"
            >
              Clear
            </button>
          </div>
          <div className="space-y-1.5">
            {scanHistory.slice(0, 10).map((item, i) => (
              <div
                key={`${item.cartonCode}-${i}`}
                className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-white/5 border border-white/5"
              >
                <div className="w-7 h-7 rounded-full bg-emerald-500/15 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 size={14} className="text-emerald-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white/80 font-body truncate">
                    #{item.cartonCode}
                  </p>
                </div>
                <span className="text-[11px] text-white/40 font-body flex-shrink-0">
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── Bottom padding for navigation safety ──────────────────────── */}
      <div className="h-4" />
    </div>
  );
}
