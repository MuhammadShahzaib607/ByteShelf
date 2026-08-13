"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, X, User, Home } from "lucide-react";

// ─── Feature bullets (emerald dot indicators) ──────────────────────────────────

const FEATURES = [
  "Real-time warehouse booking and space management",
  "Carton QR code scanning and inbound inventory tracking",
  "Live order dispatch and fulfillment updates",
];

interface AuthRequiredModalProps {
  open: boolean;
  /** Dismisses the modal (X button or backdrop click). */
  onClose: () => void;
  /** Called when the guest chooses "Continue browsing as guest". */
  onContinueAsGuest?: () => void;
}

/**
 * "Sign in Required" modal — rendered over protected routes when an
 * unauthenticated guest tries to access them. Follows the ByteShelf dark
 * theme: Slate-900 surface, Emerald/Lime (#84cc16) accents, slate-800 borders.
 */
export default function AuthRequiredModal({
  open,
  onClose,
  onContinueAsGuest,
}: AuthRequiredModalProps) {
  const router = useRouter();

  // ─── Lock body scroll while the modal is open ───────────────────────────
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const handleContinueAsGuest = () => {
    if (onContinueAsGuest) {
      onContinueAsGuest();
    } else {
      router.replace("/");
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="w-full max-w-md rounded-3xl bg-slate-900/95 border border-slate-800 shadow-2xl shadow-black/60 overflow-hidden"
            role="dialog"
            aria-modal="true"
            aria-labelledby="auth-required-title"
          >
            {/* ─── Header ─── */}
            <div className="flex items-center justify-between gap-3 px-6 pt-6">
              <div className="flex items-center gap-3 min-w-0">
                {/* Lock icon — subtle emerald container */}
                <div className="w-11 h-11 shrink-0 rounded-2xl bg-[#84cc16]/10 border border-[#84cc16]/25 flex items-center justify-center shadow-[0_0_20px_rgba(132,204,22,0.12)]">
                  <Lock size={20} className="text-[#84cc16]" />
                </div>
                <h2
                  id="auth-required-title"
                  className="font-heading text-lg font-bold text-white truncate"
                >
                  Sign in Required
                </h2>
              </div>
              {/* Close button — top right */}
              <button
                onClick={onClose}
                aria-label="Close"
                className="w-8 h-8 shrink-0 rounded-full bg-white/5 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* ─── Body ─── */}
            <div className="px-6 py-5">
              <p className="text-sm text-slate-400 font-body leading-relaxed">
                To access our warehouse management tool and connect with
                logistics partners, please sign in or create an account. Get
                access to:
              </p>

              {/* Feature bullet list — emerald dot indicators */}
              <ul className="mt-4 space-y-2.5">
                {FEATURES.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5">
                    <span className="mt-[7px] w-1.5 h-1.5 rounded-full bg-[#84cc16] shrink-0" />
                    <span className="text-sm text-slate-300 font-body leading-snug">
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* ─── Action controls ─── */}
            <div className="px-6 pb-6 space-y-3">
              {/* Primary — Sign In (emerald accent) */}
              <Link
                href="/login"
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 bg-[#1a231d] text-[#84cc16] border border-[#84cc16]/40 rounded-xl text-sm font-body font-semibold hover:bg-[#222e26] hover:border-[#84cc16]/60 hover:shadow-lg hover:shadow-[#84cc16]/10 active:scale-[0.98] transition-all duration-200"
              >
                <Lock size={15} />
                Sign In
              </Link>

              {/* Secondary — Create Account (subtle dark outline) */}
              <Link
                href="/signup"
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 bg-slate-800/50 text-slate-200 border border-slate-700 rounded-xl text-sm font-body font-medium hover:bg-slate-800 hover:text-white hover:border-slate-600 active:scale-[0.98] transition-all duration-200"
              >
                <User size={15} />
                Create Account
              </Link>

              {/* Divider — centered "or" */}
              <div className="flex items-center gap-3 py-1">
                <span className="flex-1 h-px bg-slate-800" />
                <span className="text-[10px] font-semibold tracking-widest text-slate-500 uppercase font-body">
                  or
                </span>
                <span className="flex-1 h-px bg-slate-800" />
              </div>

              {/* Guest action — back to public landing */}
              <button
                onClick={handleContinueAsGuest}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 text-slate-400 hover:text-white rounded-xl text-sm font-body font-medium hover:bg-white/5 active:scale-[0.98] transition-all duration-200"
              >
                <Home size={15} />
                Continue browsing as guest
              </button>

              {/* Footer caption */}
              <p className="text-center text-[11px] text-slate-500 font-body">
                Note: Some features may be limited in guest mode
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
