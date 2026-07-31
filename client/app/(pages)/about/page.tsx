"use client";

import { motion } from "framer-motion";
import {
  Target,
  Eye,
  TrendingUp,
  Warehouse,
  MapPin,
  Shield,
  Layers,
  ChevronRight,
  Cpu,
  Server,
  Database,
  Radio,
  QrCode,
  Cloud,
  ShieldCheck,
  Rocket,
} from "lucide-react";
import Link from "next/link";

const values = [
  {
    icon: TrendingUp,
    title: "Efficiency",
    description:
      "Maximize storage utilization with pay-per-shelf micro-warehousing. No wasted space, no wasted spend.",
  },
  {
    icon: Eye,
    title: "Transparency",
    description:
      "Real-time inventory tracking, direct owner communication, and clear pricing with no hidden fees.",
  },
  {
    icon: Shield,
    title: "Scalability",
    description:
      "Scale your storage up or down as your business grows. Add shelves, book space, and expand effortlessly.",
  },
];

const metrics = [
  { icon: Layers, value: "10,000+", label: "Active Shelves" },
  { icon: Warehouse, value: "500+", label: "Warehouse Partners" },
  { icon: MapPin, value: "50+", label: "Cities Covered" },
  { icon: Shield, value: "98%", label: "Owner Satisfaction" },
];

const techStack = [
  { icon: Cloud, label: "Cloud Hosting" },
  { icon: Database, label: "MongoDB" },
  { icon: Server, label: "Node.js API" },
  { icon: Radio, label: "Real-time Socket.io" },
  { icon: QrCode, label: "QR Tracking" },
  { icon: ShieldCheck, label: "JWT Auth" },
  { icon: Cpu, label: "Next.js" },
  { icon: Rocket, label: "Edge-Ready" },
];

const stagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.12 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#0D0F0A] flex flex-col">
      <main className="flex-1">
        {/* ─── Hero ─────────────────────────────────────────────────────────── */}
        <section className="relative pt-32 sm:pt-40 pb-16 sm:pb-20 overflow-hidden bg-gradient-to-b from-[#0F1209] via-[#14180C] to-[#0A0D07]">
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute -top-32 -right-32 w-[28rem] h-[28rem] rounded-full bg-[#D0F219]/[0.07] blur-3xl" />
            <div className="absolute -bottom-40 -left-32 w-96 h-96 rounded-full bg-emerald-500/[0.06] blur-3xl" />
          </div>

          <div className="relative max-w-5xl mx-auto px-4 sm:px-8 lg:px-16 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="section-badge-lime inline-flex mx-auto mb-6">
                <Target size={12} />
                Our Mission
              </div>
              <h1 className="font-heading text-4xl sm:text-5xl md:text-6xl font-bold text-white leading-[1.1] tracking-tight">
                Reshaping How
                <br />
                <span className="bg-gradient-to-r from-[#D0F219] via-lime-200 to-emerald-400 bg-clip-text text-transparent">
                  Businesses Store
                </span>
              </h1>
              <p className="mt-6 max-w-2xl mx-auto text-base sm:text-lg text-slate-300 font-body leading-relaxed">
                ByteShelf connects merchants with verified micro-warehouse space —
                no long-term leases, no minimums. We believe storage should be as
                flexible as the businesses that need it.
              </p>
            </motion.div>

            {/* Mini trust stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4"
            >
              {metrics.map((m) => {
                const Icon = m.icon;
                return (
                  <div
                    key={m.label}
                    className="rounded-2xl bg-white/[0.04] backdrop-blur-xl border border-lime-500/15 p-5 text-center"
                  >
                    <Icon size={20} className="text-[#D0F219] mx-auto mb-2" />
                    <div className="font-heading text-xl sm:text-2xl font-bold text-white numeric">
                      {m.value}
                    </div>
                    <div className="mt-1 text-[11px] text-slate-400 font-body uppercase tracking-wider">
                      {m.label}
                    </div>
                  </div>
                );
              })}
            </motion.div>
          </div>
        </section>

        {/* ─── Mission / Vision Cards ───────────────────────────────────────── */}
        <section className="py-16 lg:py-20 bg-gradient-to-b from-[#0A0D07] via-[#0F1209] to-[#0A0D07]">
          <div className="max-w-6xl mx-auto px-4 sm:px-8 lg:px-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-center mb-12"
            >
              <div className="section-badge-lime inline-flex mx-auto mb-4">
                <Target size={12} />
                Why We Exist
              </div>
              <h2 className="font-heading text-3xl sm:text-4xl font-bold text-white tracking-tight">
                Mission &amp;{" "}
                <span className="bg-gradient-to-r from-[#D0F219] via-lime-200 to-emerald-400 bg-clip-text text-transparent">
                  Vision
                </span>
              </h2>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              variants={stagger}
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              <motion.div
                variants={fadeUp}
                className="group relative overflow-hidden rounded-3xl bg-white/[0.04] backdrop-blur-xl border border-lime-500/15 hover:border-lime-400/40 p-8 sm:p-10 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_20px_50px_rgba(208,242,25,0.08)]"
              >
                <div className="absolute -top-20 -right-20 w-56 h-56 rounded-full bg-[#D0F219]/[0.06] blur-3xl pointer-events-none" />
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#D0F219] to-emerald-400 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(208,242,25,0.35)]">
                  <Target size={24} className="text-[#12140E]" />
                </div>
                <h3 className="font-heading text-xl font-bold text-white mb-3">
                  Our Mission
                </h3>
                <p className="text-sm text-slate-400 font-body leading-relaxed">
                  To make flexible, affordable storage accessible to every growing
                  business — replacing rigid leases with on-demand shelf space,
                  real-time tracking, and direct owner communication.
                </p>
              </motion.div>

              <motion.div
                variants={fadeUp}
                className="group relative overflow-hidden rounded-3xl bg-white/[0.04] backdrop-blur-xl border border-lime-500/15 hover:border-lime-400/40 p-8 sm:p-10 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_20px_50px_rgba(208,242,25,0.08)]"
              >
                <div className="absolute -bottom-20 -left-20 w-56 h-56 rounded-full bg-emerald-500/[0.06] blur-3xl pointer-events-none" />
                <div className="w-14 h-14 rounded-2xl bg-[#D0F219]/10 border border-lime-500/25 flex items-center justify-center mb-6">
                  <Eye size={24} className="text-[#D0F219]" />
                </div>
                <h3 className="font-heading text-xl font-bold text-white mb-3">
                  Our Vision
                </h3>
                <p className="text-sm text-slate-400 font-body leading-relaxed">
                  A world where storage capacity is shared, verified, and fully
                  utilized — where no shelf sits empty while a merchant nearby
                  searches for space.
                </p>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* ─── Core Values ───────────────────────────────────────────────────── */}
        <section className="py-16 lg:py-20 bg-gradient-to-b from-[#0A0D07] via-[#0F1209] to-[#0A0D07]">
          <div className="max-w-6xl mx-auto px-4 sm:px-8 lg:px-16">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              variants={stagger}
              className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8"
            >
              {values.map((v, i) => (
                <motion.div
                  key={v.title}
                  variants={fadeUp}
                  custom={i}
                  className="group bg-white/[0.04] backdrop-blur-xl border border-lime-500/15 hover:border-lime-400/40 rounded-3xl p-6 sm:p-8 transition-all duration-500 hover:-translate-y-1.5 hover:shadow-[0_20px_50px_rgba(208,242,25,0.08)]"
                >
                  <div className="w-12 h-12 rounded-xl bg-[#D0F219]/10 border border-lime-500/20 flex items-center justify-center mb-5 group-hover:bg-[#D0F219]/20 group-hover:scale-110 transition-all duration-300">
                    <v.icon size={22} className="text-[#D0F219]" />
                  </div>
                  <h3 className="font-heading text-lg font-semibold text-white mb-3">
                    {v.title}
                  </h3>
                  <p className="text-sm text-slate-400 font-body leading-relaxed">
                    {v.description}
                  </p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ─── Storage Tech Stack Grid ──────────────────────────────────────── */}
        <section className="py-16 lg:py-20 bg-gradient-to-b from-[#0A0D07] via-[#0F1209] to-[#0A0D07]">
          <div className="max-w-6xl mx-auto px-4 sm:px-8 lg:px-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-center mb-12"
            >
              <div className="section-badge-lime inline-flex mx-auto mb-4">
                <Cpu size={12} />
                Built To Scale
              </div>
              <h2 className="font-heading text-3xl sm:text-4xl font-bold text-white tracking-tight">
                Storage Tech{" "}
                <span className="bg-gradient-to-r from-[#D0F219] via-lime-200 to-emerald-400 bg-clip-text text-transparent">
                  Stack
                </span>
              </h2>
              <p className="mt-4 text-slate-400 font-body text-sm sm:text-base max-w-xl mx-auto">
                A modern, real-time platform engineered for reliability at scale.
              </p>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.1 }}
              variants={stagger}
              className="grid grid-cols-2 sm:grid-cols-4 gap-4"
            >
              {techStack.map((t) => {
                const Icon = t.icon;
                return (
                  <motion.div
                    key={t.label}
                    variants={fadeUp}
                    className="group rounded-2xl bg-[#12140E]/80 border border-lime-500/10 hover:border-lime-400/40 p-5 text-center transition-all duration-300 hover:-translate-y-1 hover:bg-[#1A1D16] hover:shadow-[0_10px_30px_rgba(208,242,25,0.08)]"
                  >
                    <Icon size={22} className="text-[#D0F219] mx-auto mb-3 group-hover:scale-110 transition-transform duration-300" />
                    <p className="text-xs text-slate-300 font-body font-medium">
                      {t.label}
                    </p>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </section>

        {/* ─── CTA ───────────────────────────────────────────────────────────── */}
        <section className="py-16 lg:py-20 bg-gradient-to-b from-[#0A0D07] via-[#0F1209] to-[#0A0D07]">
          <div className="max-w-4xl mx-auto px-4 sm:px-8 lg:px-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="relative overflow-hidden bg-gradient-to-br from-[#D0F219]/[0.12] via-[#12140E] to-[#0D0F0A] rounded-3xl p-8 sm:p-12 text-center shadow-2xl shadow-lime-950/30 border border-lime-500/20"
            >
              <div className="absolute -top-28 left-1/2 -translate-x-1/2 w-96 h-40 rounded-full bg-[#D0F219]/10 blur-3xl pointer-events-none" />
              <div className="relative">
                <h2 className="font-heading text-2xl sm:text-3xl font-bold text-white">
                  Ready to get{" "}
                  <span className="bg-gradient-to-r from-[#D0F219] via-lime-200 to-emerald-400 bg-clip-text text-transparent">
                    started?
                  </span>
                </h2>
                <p className="mt-3 text-slate-400 font-body text-sm sm:text-base max-w-md mx-auto">
                  Join thousands of businesses already using ByteShelf.
                </p>
                <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Link
                    href="/signup"
                    className="inline-flex items-center gap-2 px-8 py-3.5 bg-[#D0F219] text-[#12140E] rounded-full font-body font-medium text-base hover:bg-lime-300 hover:shadow-[0_0_40px_rgba(208,242,25,0.4)] active:scale-95 transition-all duration-200"
                  >
                    Create Free Account
                    <ChevronRight size={18} />
                  </Link>
                  <Link
                    href="/contact"
                    className="inline-flex items-center gap-2 px-8 py-3.5 border border-lime-500/30 text-lime-200 rounded-full font-body font-medium text-base hover:bg-lime-400/10 hover:border-lime-400/50 active:scale-95 transition-all duration-200"
                  >
                    Contact Us
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      </main>
    </div>
  );
}
