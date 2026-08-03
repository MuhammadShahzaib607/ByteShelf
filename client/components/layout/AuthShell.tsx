"use client";

import { motion } from "framer-motion";
import AmbientBackground from "@/components/ui/AmbientBackground";

// ═══════════════════════════════════════════════════════════════════════════════
// AUTH SHELL — interactive Awwwards-style motion background + centered glass card
// ═══════════════════════════════════════════════════════════════════════════════

export default function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen w-full flex items-center justify-center px-4 py-12 overflow-hidden bg-[#05080e]">
      {/* ─── Soft ambient emerald aura ─── */}
      <div
        className="pointer-events-none absolute top-1/3 left-1/2 -translate-x-1/2 w-[560px] h-[560px] rounded-full bg-emerald-500/10 blur-[130px]"
        aria-hidden="true"
      />

      {/* ─── Awwwards-style ambient background (orbs + veil + grid + aura) ─── */}
      <AmbientBackground />

      {/* ─── Centered glass card + hover glow pulse ─── */}
      <div className="group relative z-10 w-full max-w-lg">
        {/* Outer glow that pulses on hover */}
        <div
          className="auth-card-glow pointer-events-none absolute -inset-px rounded-3xl bg-[#84cc16]/[0.07] blur-md"
          aria-hidden="true"
        />
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: "spring", stiffness: 100, damping: 22 }}
          className="relative flex flex-col gap-6 bg-slate-900/40 border border-[#84cc16]/20 backdrop-blur-2xl rounded-3xl p-8 sm:p-10 shadow-[0_0_50px_rgba(0,0,0,0.8)] transition-colors duration-300 hover:border-[#84cc16]/40"
        >
          {children}
        </motion.div>
      </div>
    </div>
  );
}
