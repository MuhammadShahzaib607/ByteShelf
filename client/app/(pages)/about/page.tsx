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
    <div className="min-h-screen bg-white flex flex-col">
      <main className="flex-1 pt-28 pb-20">
        {/* Hero */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center mb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#0284C7]/5 border border-[#0284C7]/10 text-[#0284C7]/70 text-sm font-body mb-6">
              <Target size={14} />
              Our Mission
            </div>
            <h1 className="font-heading text-4xl sm:text-5xl md:text-6xl font-bold text-[#1E293B] leading-[1.1] tracking-tight">
              Reshaping How
              <br />
              <span className="text-[#0284C7]">Businesses Store</span>
            </h1>
            <p className="mt-6 max-w-2xl mx-auto text-base sm:text-lg text-[#0F172A]/60 font-body leading-relaxed">
              ByteShelf connects merchants with verified micro-warehouse space —
              no long-term leases, no minimums. We believe storage should be as
              flexible as the businesses that need it.
            </p>
          </motion.div>
        </section>

        {/* Value Cards */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-20">
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
                className="group bg-white rounded-2xl p-6 sm:p-8 shadow-sm hover:shadow-xl transition-all duration-500 hover:-translate-y-1 border border-[#E2E8F0]"
              >
                <div className="w-12 h-12 rounded-xl bg-[#F8FAFC] flex items-center justify-center mb-5 group-hover:bg-[#0284C7]/5 transition-colors">
                  <v.icon size={22} className="text-[#0284C7]" />
                </div>
                <h3 className="font-heading text-lg font-semibold text-[#1E293B] mb-3">
                  {v.title}
                </h3>
                <p className="text-sm text-[#0F172A]/60 font-body leading-relaxed">
                  {v.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* Metrics Banner */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="bg-[#1E293B] rounded-3xl p-8 sm:p-12 md:p-16 shadow-xl shadow-slate-900/20"
          >
            <div className="text-center mb-10">
              <h2 className="font-heading text-2xl sm:text-3xl font-bold text-white">
                ByteShelf by the Numbers
              </h2>
              <p className="mt-2 text-white/50 font-body text-sm">
                Trusted data from our growing community
              </p>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12">
              {metrics.map((m) => {
                const Icon = m.icon;
                return (
                  <div key={m.label} className="text-center">
                    <div className="w-12 h-12 rounded-xl bg-[#0284C7]/20 flex items-center justify-center mx-auto mb-4">
                      <Icon size={22} className="text-[#0284C7]" />
                    </div>
                    <div className="font-heading text-2xl sm:text-3xl font-bold text-white">
                      {m.value}
                    </div>
                    <div className="mt-1 text-xs text-white/50 font-body uppercase tracking-wider">
                      {m.label}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </section>

        {/* CTA */}
        <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="bg-gradient-to-br from-[#F8FAFC] to-white rounded-3xl p-8 sm:p-12 text-center shadow-sm border border-[#E2E8F0]"
          >
            <h2 className="font-heading text-2xl sm:text-3xl font-bold text-[#1E293B]">
              Ready to get started?
            </h2>
            <p className="mt-3 text-[#0F172A]/50 font-body text-sm sm:text-base max-w-md mx-auto">
              Join thousands of businesses already using ByteShelf.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 px-8 py-3.5 bg-[#1E293B] text-white rounded-full font-body font-medium text-base hover:bg-[#0284C7] transition-all duration-300 shadow-md shadow-slate-900/10 hover:shadow-lg"
              >
                Create Free Account
                <ChevronRight size={18} />
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 px-8 py-3.5 border-2 border-[#E2E8F0] text-[#1E293B] rounded-full font-body font-medium text-base hover:bg-[#F8FAFC]/60 transition-all duration-300"
              >
                Contact Us
              </Link>
            </div>
          </motion.div>
        </section>
      </main>
    </div>
  );
}
