"use client";

import { useState } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import {
  Search,
  Layers,
  Package,
  QrCode,
  TrendingUp,
  CheckCircle,
  DollarSign,
  List,
  ArrowRight,
  Briefcase,
  Compass,
  Store,
} from "lucide-react";
import Link from "next/link";

const merchantSteps = [
  {
    step: "01",
    icon: Search,
    title: "Find Space",
    desc: "Browse verified micro-warehouses by location, price, and availability. Filter by what matters to you.",
  },
  {
    step: "02",
    icon: Layers,
    title: "Book Shelves",
    desc: "Select the exact number of shelves you need and book instantly. No leases, no minimums.",
  },
  {
    step: "03",
    icon: Package,
    title: "Create Inbound Plan",
    desc: "Plan your shipments with our inbound planning tool — carton by carton. Stay organized from day one.",
  },
  {
    step: "04",
    icon: QrCode,
    title: "Track via QR",
    desc: "Scan QR codes on arrival to track inventory in real time. Know exactly where everything is.",
  },
];

const ownerSteps = [
  {
    step: "01",
    icon: List,
    title: "List Space",
    desc: "Create your warehouse profile with photos, pricing, and shelf count. Set your own rates.",
  },
  {
    step: "02",
    icon: TrendingUp,
    title: "Set Availability",
    desc: "Define how many shelves you offer and manage availability in real time from your dashboard.",
  },
  {
    step: "03",
    icon: CheckCircle,
    title: "Accept Bookings",
    desc: "Review and confirm merchant booking requests with one click. Full control over your space.",
  },
  {
    step: "04",
    icon: DollarSign,
    title: "Earn Revenue",
    desc: "Receive automated payments and track your earnings from the dashboard. Passive income made simple.",
  },
];

// ─── Directional zig-zag variant ──────────────────────────────────────────────
// Even steps (left side) slide in from the left (x: -40), odd steps (right
// side) slide in from the right (x: 40). Typed as Variants so the easing
// string stays a literal (avoiding string-widening type errors).
const zigzagFromLeft: Variants = {
  hidden: { opacity: 0, x: -40 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

const zigzagFromRight: Variants = {
  hidden: { opacity: 0, x: 40 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

export default function HowItWorksPage() {
  const [activeRole, setActiveRole] = useState<"merchant" | "owner">("merchant");
  const steps = activeRole === "merchant" ? merchantSteps : ownerSteps;

  return (
    <div className="min-h-screen bg-[#0D0F0A] flex flex-col">
      <main className="flex-1">
        {/* ─── Hero ─────────────────────────────────────────────────────────── */}
        <section className="relative pt-32 sm:pt-40 pb-16 sm:pb-20 overflow-hidden bg-gradient-to-b from-[#0F1209] via-[#14180C] to-[#0A0D07]">
          <div className="relative max-w-5xl mx-auto px-4 sm:px-8 lg:px-16 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="section-badge-lime inline-flex mx-auto mb-6">
                <Compass size={12} />
                How ByteShelf Works
              </div>
              <h1 className="font-heading text-4xl sm:text-5xl md:text-6xl font-bold text-white leading-[1.1] tracking-tight">
                Smart Storage in{" "}
                <span className="bg-gradient-to-r from-[#D0F219] via-lime-200 to-emerald-400 bg-clip-text text-transparent">
                  Four Simple Steps
                </span>
              </h1>
              <p className="mt-6 max-w-2xl mx-auto text-base sm:text-lg text-slate-300 font-body leading-relaxed">
                Whether you&apos;re a merchant looking for flexible shelf space or a
                warehouse owner wanting to monetize unused capacity, ByteShelf makes
                it effortless.
              </p>
            </motion.div>
          </div>
        </section>

        {/* ─── Interactive Role Timeline (zig-zag) ──────────────────────────── */}
        <section className="py-16 lg:py-24 bg-gradient-to-b from-[#0A0D07] via-[#0F1209] to-[#0A0D07]">
          <div className="max-w-5xl mx-auto px-4 sm:px-8 lg:px-16">
            {/* Role switcher */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="flex items-center justify-center mb-12"
            >
              <div className="inline-flex p-1.5 rounded-full bg-[#12140E] border border-lime-500/15 shadow-lg shadow-lime-950/20">
                <button
                  onClick={() => setActiveRole("merchant")}
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-body font-medium transition-all duration-300 ${
                    activeRole === "merchant"
                      ? "bg-[#D0F219] text-[#12140E] shadow-[0_0_20px_rgba(208,242,25,0.3)]"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <Store size={16} />
                  For Merchants
                </button>
                <button
                  onClick={() => setActiveRole("owner")}
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-body font-medium transition-all duration-300 ${
                    activeRole === "owner"
                      ? "bg-[#D0F219] text-[#12140E] shadow-[0_0_20px_rgba(208,242,25,0.3)]"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <Briefcase size={16} />
                  For Warehouse Owners
                </button>
              </div>
            </motion.div>

            {/* Zig-zag timeline */}
            <div className="relative">
              {/* Connecting line — left on mobile, centered on desktop */}
              <motion.div
                initial={{ scaleY: 0 }}
                whileInView={{ scaleY: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.9, ease: "easeOut" }}
                className="absolute left-7 top-3 bottom-3 w-px -translate-x-1/2 bg-gradient-to-b from-[#D0F219]/60 via-lime-500/30 to-emerald-500/20 origin-top md:left-1/2"
              />

              <div className="space-y-10 md:space-y-12">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeRole}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.35 }}
                    className="space-y-10 md:space-y-12"
                  >
                    {steps.map((item, i) => {
                      const Icon = item.icon;
                      const isLeft = i % 2 === 0; // even → left, odd → right
                      return (
                        <div
                          key={`${activeRole}-${item.step}`}
                          className="relative flex items-center gap-6 md:gap-0"
                        >
                          {/* Node — in-flow on mobile (left-aligned), absolutely centered on desktop */}
                          <div className="relative z-10 shrink-0 md:absolute md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 w-14 h-14 rounded-2xl bg-gradient-to-br from-[#D0F219] to-emerald-400 flex items-center justify-center shadow-[0_0_25px_rgba(208,242,25,0.35)]">
                            <Icon size={22} className="text-[#12140E]" />
                            <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-[#12140E] border border-lime-500/40 text-[10px] font-bold text-[#D0F219] flex items-center justify-center font-body">
                              {item.step}
                            </span>
                          </div>

                          {/* Card — mobile: right of node; desktop: left (even) / right (odd) */}
                          <motion.div
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true, amount: 0.3 }}
                            variants={isLeft ? zigzagFromLeft : zigzagFromRight}
                            className={`w-full md:w-[calc(50%-3rem)] ${
                              isLeft
                                ? "md:mr-auto md:text-right md:pr-12"
                                : "md:ml-auto md:text-left md:pl-12"
                            }`}
                          >
                            <div className="inline-block w-full text-left group bg-white/[0.04] backdrop-blur-xl border border-lime-500/15 hover:border-lime-400/40 rounded-3xl p-6 sm:p-7 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(208,242,25,0.08)]">
                              <span className="text-xs font-semibold tracking-wider text-[#D0F219] uppercase font-body">
                                Step {item.step}
                              </span>
                              <h3 className="font-heading text-lg font-semibold text-white mt-1.5 mb-2">
                                {item.title}
                              </h3>
                              <p className="text-sm text-slate-400 font-body leading-relaxed">
                                {item.desc}
                              </p>
                            </div>
                          </motion.div>
                        </div>
                      );
                    })}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

            {/* CTA under timeline */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="mt-14 text-center"
            >
              <div className="inline-flex flex-col sm:flex-row items-center gap-4">
                <Link
                  href="/signup"
                  className="inline-flex items-center gap-2 px-8 py-3.5 bg-[#D0F219] text-[#12140E] rounded-full font-body font-medium text-base hover:bg-lime-300 hover:shadow-[0_0_40px_rgba(208,242,25,0.4)] active:scale-95 transition-all duration-200"
                >
                  Create Free Account
                  <ArrowRight size={18} />
                </Link>
                <Link
                  href="/explore"
                  className="inline-flex items-center gap-2 px-8 py-3.5 border border-lime-500/30 text-lime-200 rounded-full font-body font-medium text-base hover:bg-lime-400/10 hover:border-lime-400/50 active:scale-95 transition-all duration-200"
                >
                  Browse Warehouses
                </Link>
              </div>
            </motion.div>
          </div>
        </section>
      </main>
    </div>
  );
}
