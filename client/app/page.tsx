"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Warehouse,
  Package,
  MessageCircle,
  TrendingUp,
  Layers,
  MapPin,
  Shield,
  DollarSign,
  Search,
  QrCode,
  List,
  Briefcase,
  ChevronDown,
  CheckCircle,
  LayoutDashboard,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import api from "@/lib/axios";
import ImageCarousel from "@/components/ui/ImageCarousel";
import FloatingChatButton from "@/components/ui/FloatingChatButton";

// ─── Types ──────────────────────────────────────────────────────────────────────

interface WarehouseData {
  _id: string;
  name: string;
  location: string;
  pricePerShelf: number;
  totalShelves: number;
  images: string[];
  owner: string;
}

// ─── Animation Variants ─────────────────────────────────────────────────────────

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.12, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number] },
  }),
};

const stagger = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.1 },
  },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number] },
  },
};

// ─── Feature Card Data ──────────────────────────────────────────────────────────

const valueProps = [
  {
    icon: Layers,
    title: "Pay Per Shelf, Not Square Feet",
    description:
      "Only pay for the exact shelf space you use. No wasted square footage means lower costs and smarter inventory management.",
  },
  {
    icon: Package,
    title: "Real-Time Carton Tracking & Inbound Plans",
    description:
      "Track every carton from arrival to storage. Create inbound plans, update quantities, and stay in control of your inventory.",
  },
  {
    icon: MessageCircle,
    title: "Direct Owner Communication & Verified Locations",
    description:
      "Chat directly with warehouse owners. Every location is verified so you can trust the space you're booking.",
  },
];

// ─── FAQ Data ───────────────────────────────────────────────────────────────────

const faqs = [
  {
    q: "How does ByteShelf pricing work?",
    a: "You pay per shelf per month — no long-term lease required. Each warehouse sets its own price, so you can compare and choose what fits your budget. There are no hidden fees.",
  },
  {
    q: "Can I list my warehouse space?",
    a: "Absolutely! If you're a warehouse owner with extra shelf space, you can list on ByteShelf, set your own price, and start earning passive revenue from unused capacity.",
  },
  {
    q: "How do I track inventory in real time?",
    a: "Every carton and shelf is tracked in our system. You can create inbound plans, scan QR codes on arrival, and monitor stock levels from your dashboard in real time.",
  },
  {
    q: "Is my inventory insured?",
    a: "All verified warehouse partners meet our safety and security standards. For specific insurance inquiries, reach out to the warehouse owner directly through our built-in chat.",
  },
  {
    q: "How do I get started as a merchant?",
    a: "Simply sign up, browse available warehouses by location and price, book the shelves you need, and start shipping your inventory. The entire process takes minutes.",
  },
];

// ─── Warehouse Card with Image Carousel ─────────────────────────────────────────

function WarehouseCard({ warehouse }: { warehouse: WarehouseData }) {
  return (
    <motion.div
      variants={scaleIn}
      className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 hover:-translate-y-1 border border-[#0284C7]/10 flex flex-col"
    >
      {/* Image Carousel (shared component) */}
      <ImageCarousel images={warehouse.images || []} alt={warehouse.name} aspectRatio="h-52" />

      {/* Content */}
      <div className="p-5 flex flex-col flex-1">
        <h3 className="font-heading text-lg font-semibold text-[#1E293B]">
          {warehouse.name}
        </h3>
        <div className="mt-1.5 flex items-center gap-1.5 text-xs text-[#0F172A]/50 font-body">
          <MapPin size={12} />
          <span>{warehouse.location}</span>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <div>
            <span className="font-heading text-xl font-bold text-[#1E293B] numeric">
              Rs. {warehouse.pricePerShelf.toLocaleString("en-PK")}
            </span>
            <span className="text-xs text-[#0F172A]/50 font-body ml-1">
              /shelf/mo
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-[#0F172A]/50 font-body">
            <Layers size={13} />
            <span>{warehouse.totalShelves} shelves</span>
          </div>
        </div>

        <Link
          href={`/warehouse/${warehouse._id}`}
          className="mt-4 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#1E293B] text-white text-sm font-body font-medium rounded-full hover:bg-[#0284C7] transition-all duration-300 shadow-sm shadow-slate-900/10 hover:shadow-md"
        >
          View Details & Book
          <ArrowRight size={15} />
        </Link>
      </div>
    </motion.div>
  );
}

// ─── Skeleton Card ──────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-[#0284C7]/10 animate-pulse">
      <div className="h-52 bg-[#F8FAFC]" />
      <div className="p-5 space-y-3">
        <div className="h-5 bg-[#F8FAFC] rounded w-3/4" />
        <div className="h-3 bg-[#F8FAFC] rounded w-1/2" />
        <div className="flex justify-between pt-2">
          <div className="h-6 bg-[#F8FAFC] rounded w-1/3" />
          <div className="h-4 bg-[#F8FAFC] rounded w-1/4" />
        </div>
        <div className="h-10 bg-[#F8FAFC] rounded-full w-full mt-2" />
      </div>
    </div>
  );
}

// ─── FAQ Accordion Item ────────────────────────────────────────────────────────

function FaqItem({
  question,
  answer,
  isOpen,
  onToggle,
}: {
  question: string;
  answer: string;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="border-b border-[#0284C7]/10 last:border-0">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-4 py-5 text-left"
      >
        <span className="font-heading text-base font-semibold text-[#1E293B]">
          {question}
        </span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="shrink-0 w-6 h-6 rounded-full bg-[#F8FAFC] flex items-center justify-center"
        >
          <ChevronDown size={14} className="text-[#0284C7]" />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <p className="pb-5 text-sm text-[#0F172A]/60 font-body leading-relaxed">
              {answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Metrics / Stats Data ───────────────────────────────────────────────────────

const stats = [
  { icon: Layers, value: "10,000+", label: "Active Shelves" },
  { icon: Shield, value: "500+", label: "Verified Owners" },
  { icon: DollarSign, value: "40%", label: "Average Savings" },
  { icon: MapPin, value: "50+", label: "Cities Covered" },
];

// ─── Section IDs for scroll navigation ──────────────────────────────────────────

const SECTION_IDS = {
  warehouses: "warehouses",
  howItWorks: "how-it-works",
  pricing: "pricing",
  contact: "contact",
};

// ═══════════════════════════════════════════════════════════════════════════════
// PAGE
// ═══════════════════════════════════════════════════════════════════════════════

export default function Home() {
  const [warehouses, setWarehouses] = useState<WarehouseData[]>([]);
  const [warehousesLoading, setWarehousesLoading] = useState(true);
  const [warehousesError, setWarehousesError] = useState(false);
  const [activeTab, setActiveTab] = useState<"merchant" | "owner">("merchant");
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // ─── Check auth state for conditional CTA ──────────────────────────────────
  useEffect(() => {
    const token =
      localStorage.getItem("byteshelf_access_token") ||
      localStorage.getItem("auth_tokens");
    setIsLoggedIn(!!token);
  }, []);

  // ─── Fetch Featured Warehouses ───────────────────────────────────────────────

  useEffect(() => {
    let cancelled = false;

    const fetchWarehouses = async () => {
      try {
        setWarehousesLoading(true);
        setWarehousesError(false);
        const res = await api.get("/warehouse/all?limit=3&page=1");
        if (!cancelled) {
          setWarehouses(res.data.data?.warehouses || []);
        }
      } catch {
        if (!cancelled) {
          setWarehousesError(true);
          setWarehouses([]);
        }
      } finally {
        if (!cancelled) setWarehousesLoading(false);
      }
    };

    fetchWarehouses();
    return () => { cancelled = true; };
  }, []);

  // ─── Scroll handler for nav links ────────────────────────────────────────────

  const scrollTo = useCallback((id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  // ─── Handlers ────────────────────────────────────────────────────────────────

  const toggleFaq = (index: number) =>
    setOpenFaqIndex(openFaqIndex === index ? null : index);

  // ═════════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═════════════════════════════════════════════════════════════════════════════

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      {/* ═══ 1. NAVBAR ═══ */}
      <Navbar />

      <main className="flex-1">
        {/* ═══ 2. HERO SECTION ═══ */}
        <section className="relative pt-32 sm:pt-40 pb-20 sm:pb-28 overflow-hidden">
          {/* Decorative blobs */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-[#1E293B]/[0.03] blur-3xl" />
            <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-[#0284C7]/[0.03] blur-3xl" />
          </div>

          <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#1E293B]/5 border border-[#1E293B]/10 text-[#1E293B]/70 text-sm font-body mb-8"
            >
              <CheckCircle size={14} />
              Trusted by 500+ warehouse owners
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
              className="font-heading text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-[#1E293B] leading-[1.1] tracking-tight"
            >
              Micro-Warehousing
              <br />
              <span className="text-[#0284C7]">Built for Growing Brands</span>
            </motion.h1>

            {/* Subheading */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
              className="mt-6 max-w-2xl mx-auto text-base sm:text-lg text-[#0F172A]/60 font-body leading-relaxed"
            >
              Merchants find affordable shelf space by the unit. Warehouse owners
              unlock passive revenue from unused capacity. No leases. No minimums.
              Just smart, flexible storage.
            </motion.p>

            {/* Dual CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <button
                onClick={() => scrollTo(SECTION_IDS.warehouses)}
                className="inline-flex items-center gap-2 px-8 py-3.5 bg-[#1E293B] text-white rounded-full font-body font-medium text-base hover:bg-[#0284C7] transition-all duration-300 shadow-md shadow-slate-900/10 hover:shadow-lg active:scale-[0.97]"
              >
                Explore Shelves
                <ArrowRight size={18} />
              </button>
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 px-8 py-3.5 border-2 border-[#1E293B] text-[#1E293B] rounded-full font-body font-medium text-base hover:bg-[#1E293B]/5 transition-all duration-300 active:scale-[0.97]"
              >
                List Your Space
              </Link>
            </motion.div>
          </div>
        </section>

        {/* ═══ 3. VALUE PROPOSITION ═══ */}
        <section className="pb-20 sm:pb-28">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              variants={stagger}
              className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8"
            >
              {valueProps.map((prop, i) => (
                <motion.div
                  key={i}
                  variants={fadeUp}
                  custom={i}
                  className="group bg-white rounded-2xl p-6 sm:p-8 shadow-sm hover:shadow-xl transition-all duration-500 hover:-translate-y-1 border border-[#0284C7]/10"
                >
                  <div className="w-12 h-12 rounded-xl bg-[#F8FAFC] flex items-center justify-center mb-5 group-hover:bg-[#1E293B]/5 transition-colors">
                    <prop.icon size={22} className="text-[#0284C7]" />
                  </div>
                  <h3 className="font-heading text-lg font-semibold text-[#1E293B] mb-3">
                    {prop.title}
                  </h3>
                  <p className="text-sm text-[#0F172A]/60 font-body leading-relaxed">
                    {prop.description}
                  </p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ═══ 4. FEATURED WAREHOUSES ═══ */}
        <section id={SECTION_IDS.warehouses} className="pb-20 sm:pb-28 scroll-mt-28">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-center mb-12"
            >
              <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl font-bold text-[#1E293B]">
                Featured Micro-Warehouses
              </h2>
              <p className="mt-3 text-[#0F172A]/50 font-body text-sm sm:text-base max-w-lg mx-auto">
                Browse verified spaces from top-rated owners in your region
              </p>
            </motion.div>

            {/* Loading state */}
            {warehousesLoading && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
              </div>
            )}

            {/* Error state */}
            {warehousesError && !warehousesLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-16"
              >
                <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center mx-auto mb-4 shadow-sm shadow-slate-900/10">
                  <Warehouse size={28} className="text-[#0284C7]/40" />
                </div>
                <h3 className="font-heading text-lg font-semibold text-[#1E293B] mb-2">
                  Sign in to explore warehouses
                </h3>
                <p className="text-sm text-[#0F172A]/50 font-body mb-6 max-w-sm mx-auto">
                  Create a free account to browse available shelf space in your area
                </p>
                <Link
                  href="/signup"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-[#1E293B] text-white rounded-full font-body text-sm font-medium hover:bg-[#0284C7] transition-all duration-300 shadow-sm shadow-slate-900/10"
                >
                  Get Started Free
                  <ArrowRight size={16} />
                </Link>
              </motion.div>
            )}

            {/* Warehouses grid */}
            {!warehousesLoading && !warehousesError && warehouses.length > 0 && (
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.1 }}
                variants={stagger}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8"
              >
                {warehouses.map((w) => (
                  <WarehouseCard key={w._id} warehouse={w} />
                ))}
              </motion.div>
            )}

            {/* Empty state */}
            {!warehousesLoading && !warehousesError && warehouses.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-16"
              >
                <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center mx-auto mb-4 shadow-sm shadow-slate-900/10">
                  <Warehouse size={28} className="text-[#0284C7]/40" />
                </div>
                <h3 className="font-heading text-lg font-semibold text-[#1E293B] mb-2">
                  No warehouses listed yet
                </h3>
                <p className="text-sm text-[#0F172A]/50 font-body mb-6">
                  Be the first to list your space!
                </p>
                <Link
                  href="/signup"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-[#1E293B] text-white rounded-full font-body text-sm font-medium hover:bg-[#0284C7] transition-all duration-300 shadow-sm shadow-slate-900/10"
                >
                  List Your Warehouse
                  <ArrowRight size={16} />
                </Link>
              </motion.div>
            )}
          </div>
        </section>

        {/* ═══ 5. HOW IT WORKS (DUAL-ROLE TOGGLE) ═══ */}
        <section id={SECTION_IDS.howItWorks} className="pb-20 sm:pb-28 scroll-mt-28">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-center mb-12"
            >
              <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl font-bold text-[#1E293B]">
                How It Works
              </h2>
              <p className="mt-3 text-[#0F172A]/50 font-body text-sm sm:text-base">
                One platform, two perspectives
              </p>
            </motion.div>

            {/* Tab switcher */}
            <div className="flex items-center justify-center mb-10">
              <div className="inline-flex p-1.5 rounded-full bg-white border border-[#0284C7]/10 shadow-sm shadow-slate-900/10">
                <button
                  onClick={() => setActiveTab("merchant")}
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-body font-medium transition-all duration-300 ${
                    activeTab === "merchant"
                      ? "bg-[#1E293B] text-white shadow-sm"
                      : "text-[#0F172A]/50 hover:text-[#0F172A]"
                  }`}
                >
                  <Search size={16} />
                  For Merchants
                </button>
                <button
                  onClick={() => setActiveTab("owner")}
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-body font-medium transition-all duration-300 ${
                    activeTab === "owner"
                      ? "bg-[#1E293B] text-white shadow-sm"
                      : "text-[#0F172A]/50 hover:text-[#0F172A]"
                  }`}
                >
                  <Briefcase size={16} />
                  For Warehouse Owners
                </button>
              </div>
            </div>

            {/* Tab Content */}
            <AnimatePresence mode="wait">
              {activeTab === "merchant" ? (
                <motion.div
                  key="merchant"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="bg-white rounded-3xl p-8 md:p-10 shadow-sm border border-[#0284C7]/10"
                >
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    {[
                      {
                        step: "01",
                        icon: Search,
                        title: "Find Space",
                        desc: "Browse verified micro-warehouses by location, price, and availability.",
                      },
                      {
                        step: "02",
                        icon: Layers,
                        title: "Book Shelves",
                        desc: "Select the exact number of shelves you need and book instantly.",
                      },
                      {
                        step: "03",
                        icon: Package,
                        title: "Create Inbound Plan",
                        desc: "Plan your shipments with our inbound planning tool — carton by carton.",
                      },
                      {
                        step: "04",
                        icon: QrCode,
                        title: "Track via QR",
                        desc: "Scan QR codes on arrival to track inventory in real time.",
                      },
                    ].map((item) => (
                      <div key={item.step} className="text-center">
                        <div className="w-14 h-14 rounded-2xl bg-[#F8FAFC] flex items-center justify-center mx-auto mb-4">
                          <item.icon size={24} className="text-[#0284C7]" />
                        </div>
                        <span className="text-xs font-semibold tracking-wider text-[#0284C7] uppercase font-body">
                          Step {item.step}
                        </span>
                        <h4 className="font-heading text-base font-semibold text-[#1E293B] mt-1 mb-2">
                          {item.title}
                        </h4>
                        <p className="text-xs text-[#0F172A]/50 font-body leading-relaxed">
                          {item.desc}
                        </p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="owner"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="bg-white rounded-3xl p-8 md:p-10 shadow-sm border border-[#0284C7]/10"
                >
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    {[
                      {
                        step: "01",
                        icon: List,
                        title: "List Space",
                        desc: "Create your warehouse profile with photos, pricing, and shelf count.",
                      },
                      {
                        step: "02",
                        icon: TrendingUp,
                        title: "Set Shelf Count",
                        desc: "Define how many shelves you offer and manage availability in real time.",
                      },
                      {
                        step: "03",
                        icon: CheckCircle,
                        title: "Accept Bookings",
                        desc: "Review and confirm merchant booking requests with one click.",
                      },
                      {
                        step: "04",
                        icon: DollarSign,
                        title: "Earn Revenue",
                        desc: "Receive automated payments and track your earnings from the dashboard.",
                      },
                    ].map((item) => (
                      <div key={item.step} className="text-center">
                        <div className="w-14 h-14 rounded-2xl bg-[#F8FAFC] flex items-center justify-center mx-auto mb-4">
                          <item.icon size={24} className="text-[#0284C7]" />
                        </div>
                        <span className="text-xs font-semibold tracking-wider text-[#0284C7] uppercase font-body">
                          Step {item.step}
                        </span>
                        <h4 className="font-heading text-base font-semibold text-[#1E293B] mt-1 mb-2">
                          {item.title}
                        </h4>
                        <p className="text-xs text-[#0F172A]/50 font-body leading-relaxed">
                          {item.desc}
                        </p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>

        {/* ═══ 6. KEY METRICS / TRUST BANNER ═══ */}
        <section className="pb-20 sm:pb-28">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
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
                {stats.map((stat) => {
                  const IconComponent = stat.icon;
                  return (
                    <motion.div
                      key={stat.label}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.4 }}
                      className="text-center"
                    >
                      <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center mx-auto mb-4">
                        <IconComponent size={22} className="text-[#F8FAFC]" />
                      </div>
                      <div className="font-heading text-2xl sm:text-3xl font-bold text-white">
                        {stat.value}
                      </div>
                      <div className="mt-1 text-xs text-white/50 font-body uppercase tracking-wider">
                        {stat.label}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          </div>
        </section>

        {/* ═══ 7. FAQ ACCORDION ═══ */}
        <section id={SECTION_IDS.pricing} className="pb-20 sm:pb-28 scroll-mt-28">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-center mb-12"
            >
              <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl font-bold text-[#1E293B]">
                Frequently Asked Questions
              </h2>
              <p className="mt-3 text-[#0F172A]/50 font-body text-sm sm:text-base">
                Everything you need to know about ByteShelf
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-[#0284C7]/10"
            >
              {faqs.map((faq, i) => (
                <FaqItem
                  key={i}
                  question={faq.q}
                  answer={faq.a}
                  isOpen={openFaqIndex === i}
                  onToggle={() => toggleFaq(i)}
                />
              ))}
            </motion.div>
          </div>
        </section>

        {/* ═══ CTA SECTION (auth-conditional) ═══ */}
        <section id={SECTION_IDS.contact} className="pb-20 sm:pb-28 scroll-mt-28">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="bg-gradient-to-br from-[#F8FAFC] to-white rounded-3xl p-8 sm:p-12 text-center shadow-sm border border-[#0284C7]/10"
            >
              <h2 className="font-heading text-2xl sm:text-3xl font-bold text-[#1E293B]">
                Ready to streamline your storage?
              </h2>
              <p className="mt-3 text-[#0F172A]/50 font-body text-sm sm:text-base max-w-md mx-auto">
                Join thousands of merchants and warehouse owners already using
                ByteShelf.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                {isLoggedIn ? (
                  <Link
                    href="/explore"
                    className="inline-flex items-center gap-2 px-8 py-3.5 bg-[#1E293B] text-white rounded-full font-body font-medium text-base hover:bg-[#0284C7] transition-all duration-300 shadow-md shadow-slate-900/10 hover:shadow-lg"
                  >
                    <LayoutDashboard size={18} />
                    Go to Dashboard
                    <ArrowRight size={18} />
                  </Link>
                ) : (
                  <>
                    <Link
                      href="/signup"
                      className="inline-flex items-center gap-2 px-8 py-3.5 bg-[#1E293B] text-white rounded-full font-body font-medium text-base hover:bg-[#0284C7] transition-all duration-300 shadow-md shadow-slate-900/10 hover:shadow-lg"
                    >
                      Create Free Account
                      <ArrowRight size={18} />
                    </Link>
                    <Link
                      href="/login"
                      className="inline-flex items-center gap-2 px-8 py-3.5 border-2 border-[#0284C7]/30 text-[#0284C7] rounded-full font-body font-medium text-base hover:bg-[#0284C7]/5 transition-all duration-300"
                    >
                      Sign In
                    </Link>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      {/* ═══ 8. FOOTER ═══ */}
      <Footer />
      <FloatingChatButton />
    </div>
  );
}
