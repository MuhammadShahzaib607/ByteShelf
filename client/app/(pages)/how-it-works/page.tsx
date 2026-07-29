"use client";

import { motion } from "framer-motion";
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

export default function HowItWorksPage() {
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
              <Compass size={14} />
              How ByteShelf Works
            </div>
            <h1 className="font-heading text-4xl sm:text-5xl md:text-6xl font-bold text-[#1E293B] leading-[1.1] tracking-tight">
              Smart Storage in
              <br />
              <span className="text-[#0284C7]">Four Simple Steps</span>
            </h1>
            <p className="mt-6 max-w-2xl mx-auto text-base sm:text-lg text-[#0F172A]/60 font-body leading-relaxed">
              Whether you&apos;re a merchant looking for flexible shelf space or a
              warehouse owner wanting to monetize unused capacity, ByteShelf makes
              it effortless.
            </p>
          </motion.div>
        </section>

        {/* For Merchants */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#0284C7]/5 border border-[#0284C7]/10 text-[#0284C7]/70 text-sm font-body mb-4">
              <Search size={14} />
              For Merchants
            </div>
            <h2 className="font-heading text-2xl sm:text-3xl font-bold text-[#1E293B]">
              Find &amp; Book Shelf Space
            </h2>
            <p className="mt-3 text-[#0F172A]/50 font-body text-sm sm:text-base max-w-lg mx-auto">
              Stop paying for whole warehouses. Pay only for the shelves you use.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {merchantSteps.map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="bg-white rounded-2xl p-6 sm:p-8 border border-[#E2E8F0] shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
              >
                <div className="w-14 h-14 rounded-2xl bg-[#F8FAFC] flex items-center justify-center mb-5">
                  <item.icon size={24} className="text-[#0284C7]" />
                </div>
                <span className="text-xs font-semibold tracking-wider text-[#0284C7] uppercase font-body">
                  Step {item.step}
                </span>
                <h3 className="font-heading text-lg font-semibold text-[#1E293B] mt-2 mb-3">
                  {item.title}
                </h3>
                <p className="text-sm text-[#0F172A]/60 font-body leading-relaxed">
                  {item.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* For Warehouse Owners */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#0284C7]/5 border border-[#0284C7]/10 text-[#0284C7]/70 text-sm font-body mb-4">
              <Briefcase size={14} />
              For Warehouse Owners
            </div>
            <h2 className="font-heading text-2xl sm:text-3xl font-bold text-[#1E293B]">
              Monetize Unused Space
            </h2>
            <p className="mt-3 text-[#0F172A]/50 font-body text-sm sm:text-base max-w-lg mx-auto">
              Turn empty shelves into a steady stream of passive income.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {ownerSteps.map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="bg-white rounded-2xl p-6 sm:p-8 border border-[#E2E8F0] shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
              >
                <div className="w-14 h-14 rounded-2xl bg-[#F8FAFC] flex items-center justify-center mb-5">
                  <item.icon size={24} className="text-[#0284C7]" />
                </div>
                <span className="text-xs font-semibold tracking-wider text-[#0284C7] uppercase font-body">
                  Step {item.step}
                </span>
                <h3 className="font-heading text-lg font-semibold text-[#1E293B] mt-2 mb-3">
                  {item.title}
                </h3>
                <p className="text-sm text-[#0F172A]/60 font-body leading-relaxed">
                  {item.desc}
                </p>
              </motion.div>
            ))}
          </div>
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
              Ready to Get Started?
            </h2>
            <p className="mt-3 text-[#0F172A]/50 font-body text-sm sm:text-base max-w-md mx-auto">
              Join thousands of businesses using ByteShelf to store smarter.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 px-8 py-3.5 bg-slate-900 text-white rounded-full font-body font-medium text-base hover:bg-slate-800 hover:shadow-lg hover:shadow-slate-900/20 active:scale-95 transition-all duration-200"
              >
                Create Free Account
                <ArrowRight size={18} />
              </Link>
              <Link
                href="/explore"
                className="inline-flex items-center gap-2 px-8 py-3.5 border-2 border-[#E2E8F0] text-[#1E293B] rounded-full font-body font-medium text-base hover:bg-[#F8FAFC]/60 transition-all duration-300"
              >
                Browse Warehouses
              </Link>
            </div>
          </motion.div>
        </section>
      </main>
    </div>
  );
}
