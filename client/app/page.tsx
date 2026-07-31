"use client";

import { useState, useEffect, useRef, useCallback } from "react";
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
  ShoppingCart,
  Store,
  Factory,
  Truck,
  Globe,
  Rocket,
  Zap,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import api from "@/lib/axios";
import ImageCarousel from "@/components/ui/ImageCarousel";
import FloatingChatButton from "@/components/ui/FloatingChatButton";
import { useAppSelector } from "@/redux/hooks";

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

// ─── Bento Feature Data ─────────────────────────────────────────────────────────

const bentoFeatures = [
  {
    icon: Layers,
    title: "Pay Per Shelf, Not Square Feet",
    description:
      "Only pay for the exact shelf space you use. No wasted square footage means lower costs and smarter inventory management.",
    badge: "Save up to 40%",
    metric: "Rs 0 wasted space",
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
  {
    icon: Shield,
    title: "Verified Locations",
    description:
      "Every warehouse passes identity & facility verification before it goes live.",
  },
  {
    icon: LayoutDashboard,
    title: "Live Dashboards",
    description:
      "Monitor bookings, inbound plans, and revenue from one clean control center.",
  },
];

// ─── Sector Data ────────────────────────────────────────────────────────────────

const sectors = [
  {
    icon: ShoppingCart,
    title: "eCommerce",
    description:
      "Scale order fulfillment without fixed leases or warehouse minimums.",
  },
  {
    icon: Store,
    title: "Retail & Distributors",
    description:
      "Hold seasonal stock close to demand and restock in days, not weeks.",
  },
  {
    icon: Factory,
    title: "Manufacturing",
    description:
      "Stage raw materials and finished goods with flexible per-shelf units.",
  },
  {
    icon: Truck,
    title: "Logistics & 3PL",
    description:
      "Extend your distribution network with verified drop-off points.",
  },
  {
    icon: Globe,
    title: "Importers",
    description:
      "Bridge customs clearance and last-mile storage for inbound shipments.",
  },
  {
    icon: Rocket,
    title: "Startups & Sellers",
    description:
      "Start small, scale fast — pay only for the space you actually use.",
  },
];

// ─── Ticker Data ────────────────────────────────────────────────────────────────

const tickerItems = [
  "Per-Shelf Pricing",
  "No Leases",
  "Real-Time QR Tracking",
  "Verified Owners",
  "Direct Owner Chat",
  "Scale As You Grow",
  "Zero Hidden Fees",
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
      className="group bg-white/[0.04] backdrop-blur-xl rounded-2xl overflow-hidden border border-lime-500/15 hover:border-lime-400/40 shadow-[0_8px_30px_rgba(0,0,0,0.35)] hover:shadow-[0_20px_50px_rgba(208,242,25,0.12)] hover:-translate-y-1.5 transition-all duration-500 flex flex-col"
    >
      {/* Image Carousel (shared component) */}
      <ImageCarousel images={warehouse.images || []} alt={warehouse.name} aspectRatio="h-52" />

      {/* Content */}
      <div className="p-5 flex flex-col flex-1">
        <h3 className="font-heading text-lg font-semibold text-white">
          {warehouse.name}
        </h3>
        <div className="mt-1.5 flex items-center gap-1.5 text-xs text-slate-400 font-body">
          <MapPin size={12} className="text-lime-400" />
          <span>{warehouse.location}</span>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <div>
            <span className="font-heading text-xl font-bold text-[#D0F219] numeric">
              Rs. {warehouse.pricePerShelf.toLocaleString("en-PK")}
            </span>
            <span className="text-xs text-slate-400 font-body ml-1">
              /shelf/mo
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-body">
            <Layers size={13} className="text-lime-400" />
            <span>{warehouse.totalShelves} shelves</span>
          </div>
        </div>

        <Link
          href={`/warehouses/${warehouse._id}`}
          className="mt-4 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#D0F219] text-[#12140E] text-sm font-body font-semibold rounded-full hover:bg-lime-300 hover:shadow-[0_0_30px_rgba(208,242,25,0.35)] active:scale-95 transition-all duration-200"
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
    <div className="bg-white/[0.04] rounded-2xl overflow-hidden border border-lime-500/10 animate-pulse">
      <div className="h-52 bg-white/[0.06]" />
      <div className="p-5 space-y-3">
        <div className="h-5 bg-white/[0.08] rounded w-3/4" />
        <div className="h-3 bg-white/[0.06] rounded w-1/2" />
        <div className="flex justify-between pt-2">
          <div className="h-6 bg-white/[0.08] rounded w-1/3" />
          <div className="h-4 bg-white/[0.06] rounded w-1/4" />
        </div>
        <div className="h-10 bg-[#D0F219]/20 rounded-full w-full mt-2" />
      </div>
    </div>
  );
}

// ─── Hero Cursor Glow (spotlight + subtle particle trail) ─────────────────────
// Lightweight: rAF-throttled lerp updates CSS vars; glow sits behind content.

function HeroCursorGlow() {
  const rootRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);
  const targetRef = useRef({ x: 0, y: 0 });
  const spotlightRef = useRef({ x: 0, y: 0 });
  const dotRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    // Only enable on hover-capable devices (skip touch-only mobile)
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

    // The glow root is pointer-events-none, so listen on the hero <section>
    // (its nearest section ancestor) which actually receives pointer events.
    const hero = root.closest("section") as HTMLElement | null;
    if (!hero) return;

    let rect = hero.getBoundingClientRect();
    const refreshRect = () => {
      rect = hero.getBoundingClientRect();
    };
    // Keep the cached rect accurate if the hero resizes for content-driven reasons
    // (font swap, carousel images loading, etc.)
    const resizeObserver =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(refreshRect)
        : null;
    resizeObserver?.observe(hero);

    const onMove = (e: MouseEvent) => {
      targetRef.current.x = e.clientX - rect.left;
      targetRef.current.y = e.clientY - rect.top;
      if (!rafRef.current) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };

    const tick = () => {
      rafRef.current = 0;
      const { x: tx, y: ty } = targetRef.current;
      const sp = spotlightRef.current;
      const dt = dotRef.current;

      // Soft follow for the glow; slightly laggier for the particle dot
      sp.x += (tx - sp.x) * 0.16;
      sp.y += (ty - sp.y) * 0.16;
      dt.x += (tx - dt.x) * 0.28;
      dt.y += (ty - dt.y) * 0.28;

      root.style.setProperty("--mouse-x", `${sp.x}px`);
      root.style.setProperty("--mouse-y", `${sp.y}px`);
      root.style.setProperty("--dot-x", `${dt.x}px`);
      root.style.setProperty("--dot-y", `${dt.y}px`);

      if (Math.abs(tx - sp.x) > 0.5 || Math.abs(ty - sp.y) > 0.5) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };

    // Fade the glow in/out as the cursor enters/leaves the hero
    const onEnter = () => {
      root.style.opacity = "1";
    };
    const onLeave = () => {
      root.style.opacity = "0";
    };

    hero.addEventListener("mousemove", onMove);
    hero.addEventListener("mouseenter", onEnter);
    hero.addEventListener("mouseleave", onLeave);
    window.addEventListener("resize", refreshRect);
    window.addEventListener("scroll", refreshRect, { passive: true });
    return () => {
      hero.removeEventListener("mousemove", onMove);
      hero.removeEventListener("mouseenter", onEnter);
      hero.removeEventListener("mouseleave", onLeave);
      window.removeEventListener("resize", refreshRect);
      window.removeEventListener("scroll", refreshRect);
      resizeObserver?.disconnect();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <div ref={rootRef} aria-hidden className="hero-cursor-glow absolute inset-0 z-0 pointer-events-none" style={{ opacity: 0, transition: "opacity 0.4s ease" }}>
      <div className="hero-cursor-spotlight" />
      <div className="hero-cursor-dot" />
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
    <div className="border-b border-lime-500/10 last:border-0">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-4 py-5 text-left"
      >
        <span className="font-heading text-base font-semibold text-white">
          {question}
        </span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="shrink-0 w-6 h-6 rounded-full bg-lime-400/10 border border-lime-500/20 flex items-center justify-center"
        >
          <ChevronDown size={14} className="text-[#D0F219]" />
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
            <p className="pb-5 text-sm text-slate-400 font-body leading-relaxed">
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
  const { user, isCheckingAuth, accessToken } = useAppSelector((state) => state.auth);

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
    <div className="min-h-screen flex flex-col bg-[#0D0F0A]">
      {/* ═══ 1. NAVBAR ═══ */}
      <Navbar />

      <main className="flex-1">
        {/* ═══ 2. HERO SECTION ═══ */}
        <section className="relative pt-32 sm:pt-40 pb-20 sm:pb-28 overflow-hidden bg-gradient-to-b from-[#0F1209] via-[#14180C] to-[#0A0D07]">
          {/* Custom cursor glow (behind content) — decorative static blobs removed */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <HeroCursorGlow />
          </div>

          <div className="relative max-w-5xl mx-auto px-4 sm:px-8 lg:px-16 text-center">
            {/* Pill tag — glass chip */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.05] border border-lime-500/25 backdrop-blur-md text-sm font-body mb-8 shadow-[0_0_30px_rgba(208,242,25,0.08)]"
            >
              <CheckCircle size={14} className="text-[#D0F219]" />
              <span className="text-slate-300">Trusted by 500+ warehouse owners</span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
              className="font-heading text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-[1.1] tracking-tight"
            >
              Micro-Warehousing
              <br />
              <span className="bg-gradient-to-r from-[#D0F219] via-lime-200 to-emerald-400 bg-clip-text text-transparent">
                Built for Growing Brands
              </span>
            </motion.h1>

            {/* Subheading */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
              className="mt-6 max-w-2xl mx-auto text-base sm:text-lg text-slate-300 font-body leading-relaxed"
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
                className="inline-flex items-center gap-2 px-8 py-3.5 bg-[#D0F219] text-[#12140E] rounded-full font-body font-semibold text-base hover:bg-lime-300 hover:shadow-[0_0_40px_rgba(208,242,25,0.4)] active:scale-95 transition-all duration-200"
              >
                Explore Shelves
                <ArrowRight size={18} />
              </button>
              <button
                onClick={() => scrollTo(SECTION_IDS.howItWorks)}
                className="inline-flex items-center gap-2 px-8 py-3.5 border border-lime-500/30 text-lime-200 rounded-full font-body font-medium text-base hover:bg-lime-400/10 hover:border-lime-400/50 active:scale-95 transition-all duration-200"
              >
                See How It Works
              </button>
              {/* <Link
                href="/warehouses/add"
                className="inline-flex items-center gap-2 px-8 py-3.5 border-2 border-slate-300 text-slate-700 rounded-full font-body font-medium text-base hover:bg-slate-50 active:scale-95 transition-all duration-200"
              >
                List Your Space
              </Link> */}
            </motion.div>

            {/* ═══ Floating Hero Preview / Dashboard Mock ═══ */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.65, ease: [0.25, 0.1, 0.25, 1] }}
              className="relative mt-16 max-w-3xl mx-auto"
            >
              {/* Glow behind card */}
              <div className="absolute -inset-8 bg-[#D0F219]/10 blur-3xl rounded-full pointer-events-none" />

              {/* Floating chip — left */}
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
                className="absolute -left-4 sm:-left-8 -top-8 z-10 inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-[#12140E]/90 border border-lime-500/25 backdrop-blur-md shadow-xl shadow-lime-950/30"
              >
                <Layers size={14} className="text-[#D0F219]" />
                <span className="text-xs text-slate-200 font-body font-medium">Live Dashboard</span>
              </motion.div>

              {/* Floating chip — right */}
              <motion.div
                animate={{ y: [0, 10, 0] }}
                transition={{ repeat: Infinity, duration: 6, ease: "easeInOut", delay: 0.6 }}
                className="absolute -right-4 sm:-right-8 -bottom-6 z-10 inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-[#12140E]/90 border border-lime-500/25 backdrop-blur-md shadow-xl shadow-lime-950/30"
              >
                <Shield size={14} className="text-[#D0F219]" />
                <span className="text-xs text-slate-200 font-body font-medium">Verified Network</span>
              </motion.div>

              {/* Main preview card */}
              <div className="relative rounded-3xl bg-[#12150E]/90 border border-lime-500/30 backdrop-blur-xl p-6 sm:p-8 shadow-2xl shadow-lime-950/40">
                {/* Preview header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#D0F219]" />
                      <span className="w-2.5 h-2.5 rounded-full bg-lime-400/40" />
                      <span className="w-2.5 h-2.5 rounded-full bg-lime-400/20" />
                    </div>
                    <span className="ml-2 text-xs text-slate-400 font-body">Owner Dashboard</span>
                  </div>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#D0F219]/10 border border-lime-500/25 text-[10px] font-semibold text-[#D0F219] font-body uppercase tracking-wider">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#D0F219] animate-pulse" />
                    Live
                  </span>
                </div>

                {/* Animated glowing utilization bars — abstract showcase */}
                <div className="rounded-xl bg-white/[0.03] border border-lime-500/15 p-4 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[11px] text-slate-400 font-body uppercase tracking-wider">
                      Shelf Utilization
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-[10px] text-[#D0F219] font-body font-semibold uppercase tracking-wider">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#D0F219] animate-pulse" />
                      Live
                    </span>
                  </div>
                  <div className="flex items-end gap-2 h-28">
                    {[38, 52, 44, 63, 58, 74, 68, 82, 76, 90, 96].map((h, i) => (
                      <motion.div
                        key={i}
                        initial={{ height: "8%" }}
                        animate={{ height: `${h}%` }}
                        transition={{ duration: 1.2, delay: i * 0.07, ease: "easeOut" }}
                        className={`flex-1 rounded-t-md ${
                          i === 10
                            ? "bg-gradient-to-t from-[#C0E70B] to-[#D0F219] shadow-[0_0_16px_rgba(208,242,25,0.6)]"
                            : "bg-gradient-to-t from-lime-500/20 to-lime-400/50"
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Sleek feature badges */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { icon: Package, label: "Inbound Plan" },
                    { icon: QrCode, label: "QR Scan" },
                    { icon: Zap, label: "Real-time sync" },
                  ].map((b) => {
                    const BIcon = b.icon;
                    return (
                      <div
                        key={b.label}
                        className="rounded-xl bg-white/[0.04] border border-lime-500/20 p-3 flex flex-col items-center gap-2"
                      >
                        <BIcon size={18} className="text-[#D0F219]" />
                        <span className="text-[10px] text-slate-300 font-body font-medium text-center leading-tight">
                          {b.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ═══ 2.5 BRAND TRUST / STATS TICKER ═══ */}
        <section className="relative py-8 border-y border-lime-500/10 bg-[#0A0D07] overflow-hidden">
          <div className="marquee-mask flex overflow-hidden">
            <div className="animate-marquee flex shrink-0 items-center">
              {/* Two identical halves — each half owns its trailing gap so the -50% loop is seamless */}
              {[0, 1].map((half) => (
                <div
                  key={half}
                  aria-hidden={half === 1 || undefined}
                  className="flex shrink-0 items-center gap-10 pr-10"
                >
                  {tickerItems.map((item, i) => (
                    <span key={i} className="flex items-center gap-10 shrink-0">
                      <span className="text-sm sm:text-base font-heading font-semibold text-slate-300 uppercase tracking-widest">
                        {item}
                      </span>
                      <span className="w-1.5 h-1.5 rounded-full bg-[#D0F219]/60" />
                    </span>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ 3. BENTO FEATURE GRID ═══ */}
        <section className="py-16 lg:py-24 bg-gradient-to-b from-[#0A0D07] via-[#0F1209] to-[#0A0D07]">
          <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-center mb-14"
            >
              <div className="section-badge-lime inline-flex mx-auto mb-4">
                <TrendingUp size={12} />
                Why ByteShelf
              </div>
              <h2 className="font-heading text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight">
                Storage That{" "}
                <span className="bg-gradient-to-r from-[#D0F219] via-lime-200 to-emerald-400 bg-clip-text text-transparent">
                  Scales With You
                </span>
              </h2>
              <p className="mt-4 text-slate-400 font-body text-sm sm:text-base max-w-xl mx-auto">
                Everything you need to run flexible, per-unit warehousing — without
                the overhead of traditional storage.
              </p>
            </motion.div>

            {/* Asymmetric bento grid */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.1 }}
              variants={stagger}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {/* Large card — col-span-2, row-span-2 */}
              <motion.div
                variants={fadeUp}
                className="group md:col-span-2 lg:row-span-2 relative bg-white/[0.04] backdrop-blur-xl border border-lime-500/15 hover:border-lime-400/40 rounded-3xl p-6 sm:p-8 overflow-hidden transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_20px_60px_rgba(208,242,25,0.10)]"
              >
                <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-[#D0F219]/[0.06] blur-3xl pointer-events-none" />
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#D0F219] to-emerald-400 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(208,242,25,0.35)]">
                  <Layers size={22} className="text-[#12140E]" />
                </div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D0F219]/10 border border-lime-500/25 text-[11px] font-semibold text-[#D0F219] font-body uppercase tracking-wider mb-4">
                  {bentoFeatures[0].badge}
                </span>
                <h3 className="font-heading text-xl sm:text-2xl font-bold text-white mb-3">
                  {bentoFeatures[0].title}
                </h3>
                <p className="text-sm text-slate-400 font-body leading-relaxed max-w-lg">
                  {bentoFeatures[0].description}
                </p>

                {/* Mini metric visual */}
                <div className="mt-6 grid grid-cols-2 gap-4">
                  <div className="rounded-2xl bg-white/[0.03] border border-lime-500/10 p-4">
                    <div className="text-[10px] text-slate-400 font-body uppercase tracking-wider">
                      Avg. monthly cost
                    </div>
                    <div className="mt-1 font-heading text-lg font-bold text-[#D0F219] numeric">
                      Rs 8,500
                    </div>
                    <div className="mt-2 h-1.5 rounded-full bg-white/[0.08] overflow-hidden">
                      <div className="h-full w-2/3 rounded-full bg-gradient-to-r from-[#D0F219] to-emerald-400" />
                    </div>
                  </div>
                  <div className="rounded-2xl bg-white/[0.03] border border-lime-500/10 p-4">
                    <div className="text-[10px] text-slate-400 font-body uppercase tracking-wider">
                      Vs. traditional lease
                    </div>
                    <div className="mt-1 font-heading text-lg font-bold text-white numeric">
                      Rs 14,200
                    </div>
                    <div className="mt-2 h-1.5 rounded-full bg-white/[0.08] overflow-hidden">
                      <div className="h-full w-full rounded-full bg-slate-500/40" />
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Stacked card 1 */}
              <motion.div
                variants={fadeUp}
                className="group bg-white/[0.04] backdrop-blur-xl border border-lime-500/15 hover:border-lime-400/40 rounded-3xl p-6 sm:p-8 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_20px_50px_rgba(208,242,25,0.08)]"
              >
                <div className="w-12 h-12 rounded-xl bg-[#D0F219]/10 border border-lime-500/20 flex items-center justify-center mb-5 group-hover:bg-[#D0F219]/20 transition-colors">
                  <Package size={22} className="text-[#D0F219] group-hover:scale-110 transition-transform duration-300" />
                </div>
                <h3 className="font-heading text-lg font-semibold text-white mb-3">
                  {bentoFeatures[1].title}
                </h3>
                <p className="text-sm text-slate-400 font-body leading-relaxed">
                  {bentoFeatures[1].description}
                </p>
              </motion.div>

              {/* Stacked card 2 */}
              <motion.div
                variants={fadeUp}
                className="group bg-white/[0.04] backdrop-blur-xl border border-lime-500/15 hover:border-lime-400/40 rounded-3xl p-6 sm:p-8 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_20px_50px_rgba(208,242,25,0.08)]"
              >
                <div className="w-12 h-12 rounded-xl bg-[#D0F219]/10 border border-lime-500/20 flex items-center justify-center mb-5 group-hover:bg-[#D0F219]/20 transition-colors">
                  <MessageCircle size={22} className="text-[#D0F219] group-hover:scale-110 transition-transform duration-300" />
                </div>
                <h3 className="font-heading text-lg font-semibold text-white mb-3">
                  {bentoFeatures[2].title}
                </h3>
                <p className="text-sm text-slate-400 font-body leading-relaxed">
                  {bentoFeatures[2].description}
                </p>
              </motion.div>

              {/* Horizontal card 1 */}
              <motion.div
                variants={fadeUp}
                className="group md:col-span-2 lg:col-span-3 bg-white/[0.04] backdrop-blur-xl border border-lime-500/15 hover:border-lime-400/40 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center gap-5 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_20px_50px_rgba(208,242,25,0.08)]"
              >
                <div className="w-14 h-14 shrink-0 rounded-2xl bg-gradient-to-br from-[#D0F219]/20 to-emerald-400/10 border border-lime-500/25 flex items-center justify-center">
                  <Shield size={24} className="text-[#D0F219]" />
                </div>
                <div className="flex-1">
                  <h3 className="font-heading text-lg font-semibold text-white mb-1.5">
                    {bentoFeatures[3].title}
                  </h3>
                  <p className="text-sm text-slate-400 font-body leading-relaxed">
                    {bentoFeatures[3].description}
                  </p>
                </div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#D0F219]/10 border border-lime-500/25 text-[11px] font-semibold text-[#D0F219] font-body uppercase tracking-wider shrink-0">
                  <CheckCircle size={12} />
                  500+ owners
                </span>
              </motion.div>

              {/* Horizontal card 2 */}
              <motion.div
                variants={fadeUp}
                className="group md:col-span-2 lg:col-span-3 bg-white/[0.04] backdrop-blur-xl border border-lime-500/15 hover:border-lime-400/40 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center gap-5 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_20px_50px_rgba(208,242,25,0.08)]"
              >
                <div className="w-14 h-14 shrink-0 rounded-2xl bg-gradient-to-br from-[#D0F219]/20 to-emerald-400/10 border border-lime-500/25 flex items-center justify-center">
                  <LayoutDashboard size={24} className="text-[#D0F219]" />
                </div>
                <div className="flex-1">
                  <h3 className="font-heading text-lg font-semibold text-white mb-1.5">
                    {bentoFeatures[4].title}
                  </h3>
                  <p className="text-sm text-slate-400 font-body leading-relaxed">
                    {bentoFeatures[4].description}
                  </p>
                </div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-[11px] font-semibold text-emerald-400 font-body uppercase tracking-wider shrink-0">
                  <Zap size={12} />
                  24/7 live
                </span>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* ═══ 4. FEATURED WAREHOUSES ═══ */}
        <section id={SECTION_IDS.warehouses} className="py-16 lg:py-24 scroll-mt-28 bg-gradient-to-b from-[#0A0D07] via-[#0F1209] to-[#0A0D07]">
          <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-center mb-12"
            >
              <div className="section-badge-lime inline-flex mx-auto mb-4">
                <Warehouse size={12} />
                Verified Warehouses
              </div>
              <h2 className="font-heading text-3xl sm:text-4xl font-bold text-white tracking-tight">
                Featured{" "}
                <span className="bg-gradient-to-r from-[#D0F219] via-lime-200 to-emerald-400 bg-clip-text text-transparent">
                  Micro-Warehouses
                </span>
              </h2>
              <p className="mt-3 text-slate-400 font-body text-sm sm:text-base max-w-lg mx-auto">
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
                <div className="w-16 h-16 rounded-2xl bg-white/[0.04] border border-lime-500/15 flex items-center justify-center mx-auto mb-4">
                  <Warehouse size={28} className="text-lime-400/40" />
                </div>
                <h3 className="font-heading text-lg font-semibold text-white mb-2">
                  Sign in to explore warehouses
                </h3>
                <p className="text-sm text-slate-400 font-body mb-6 max-w-sm mx-auto">
                  Create a free account to browse available shelf space in your area
                </p>
                <Link
                  href="/signup"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-[#D0F219] text-[#12140E] rounded-full font-body text-sm font-semibold hover:bg-lime-300 hover:shadow-[0_0_30px_rgba(208,242,25,0.35)] active:scale-95 transition-all duration-200"
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
                <div className="w-16 h-16 rounded-2xl bg-white/[0.04] border border-lime-500/15 flex items-center justify-center mx-auto mb-4">
                  <Warehouse size={28} className="text-lime-400/40" />
                </div>
                <h3 className="font-heading text-lg font-semibold text-white mb-2">
                  No warehouses listed yet
                </h3>
                <p className="text-sm text-slate-400 font-body mb-6">
                  Be the first to list your space!
                </p>
                <Link
                  href="/signup"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-[#D0F219] text-[#12140E] rounded-full font-body text-sm font-semibold hover:bg-lime-300 hover:shadow-[0_0_30px_rgba(208,242,25,0.35)] active:scale-95 transition-all duration-200"
                >
                  List Your Warehouse
                  <ArrowRight size={16} />
                </Link>
              </motion.div>
            )}
          </div>
        </section>

        {/* ═══ 5. HOW IT WORKS (DUAL-ROLE TOGGLE) ═══ */}
        <section id={SECTION_IDS.howItWorks} className="py-16 lg:py-24 scroll-mt-28 bg-gradient-to-b from-[#0A0D07] via-[#0F1209] to-[#0A0D07]">
          <div className="max-w-4xl mx-auto px-4 sm:px-8 lg:px-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-center mb-12"
            >
              <div className="section-badge-lime inline-flex mx-auto mb-4">
                <Layers size={12} />
                Smart Micro-Storage
              </div>
              <h2 className="font-heading text-3xl sm:text-4xl font-bold text-white tracking-tight">
                How{" "}
                <span className="bg-gradient-to-r from-[#D0F219] via-lime-200 to-emerald-400 bg-clip-text text-transparent">
                  It Works
                </span>
              </h2>
              <p className="mt-3 text-slate-400 font-body text-sm sm:text-base">
                One platform, two perspectives
              </p>
            </motion.div>

            {/* Tab switcher */}
            <div className="flex items-center justify-center mb-10">
              <div className="inline-flex p-1.5 rounded-full bg-[#12140E] border border-lime-500/15 shadow-lg shadow-lime-950/20">
                <button
                  onClick={() => setActiveTab("merchant")}
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-body font-medium transition-all duration-300 ${
                    activeTab === "merchant"
                      ? "bg-[#D0F219] text-[#12140E] shadow-[0_0_20px_rgba(208,242,25,0.3)]"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <Search size={16} />
                  For Merchants
                </button>
                <button
                  onClick={() => setActiveTab("owner")}
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-body font-medium transition-all duration-300 ${
                    activeTab === "owner"
                      ? "bg-[#D0F219] text-[#12140E] shadow-[0_0_20px_rgba(208,242,25,0.3)]"
                      : "text-slate-400 hover:text-white"
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
                  className="bg-white/[0.04] backdrop-blur-xl rounded-3xl p-8 md:p-10 border border-lime-500/15"
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
                        <div className="w-14 h-14 rounded-2xl bg-[#D0F219]/10 border border-lime-500/20 flex items-center justify-center mx-auto mb-4">
                          <item.icon size={24} className="text-[#D0F219]" />
                        </div>
                        <span className="text-xs font-semibold tracking-wider text-[#D0F219] uppercase font-body">
                          Step {item.step}
                        </span>
                        <h4 className="font-heading text-base font-semibold text-white mt-1 mb-2">
                          {item.title}
                        </h4>
                        <p className="text-xs text-slate-400 font-body leading-relaxed">
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
                  className="bg-white/[0.04] backdrop-blur-xl rounded-3xl p-8 md:p-10 border border-lime-500/15"
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
                        <div className="w-14 h-14 rounded-2xl bg-[#D0F219]/10 border border-lime-500/20 flex items-center justify-center mx-auto mb-4">
                          <item.icon size={24} className="text-[#D0F219]" />
                        </div>
                        <span className="text-xs font-semibold tracking-wider text-[#D0F219] uppercase font-body">
                          Step {item.step}
                        </span>
                        <h4 className="font-heading text-base font-semibold text-white mt-1 mb-2">
                          {item.title}
                        </h4>
                        <p className="text-xs text-slate-400 font-body leading-relaxed">
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
        <section className="py-16 lg:py-24 bg-gradient-to-b from-[#0A0D07] via-[#0F1209] to-[#0A0D07]">
          <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-16">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="relative overflow-hidden bg-gradient-to-br from-[#12140E] via-[#1A1D16] to-[#0D0F0A] rounded-3xl p-8 sm:p-12 md:p-16 shadow-2xl shadow-lime-950/30 border border-lime-500/15"
            >
              <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-[#D0F219]/[0.06] blur-3xl pointer-events-none" />
              <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-emerald-500/[0.05] blur-3xl pointer-events-none" />

              <div className="relative text-center mb-10">
                <div className="section-badge-lime inline-flex mx-auto mb-4">
                  <TrendingUp size={12} />
                  Platform Metrics
                </div>
                <h2 className="font-heading text-2xl sm:text-3xl font-bold text-white">
                  ByteShelf by the Numbers
                </h2>
                <p className="mt-2 text-slate-400 font-body text-sm">
                  Trusted data from our growing community
                </p>
              </div>

              <div className="relative grid grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12">
                {stats.map((stat) => {
                  const IconComponent = stat.icon;
                  return (
                    <motion.div
                      key={stat.label}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.4 }}
                      className="text-center group"
                    >
                      <div className="w-12 h-12 rounded-xl bg-[#D0F219]/10 border border-lime-500/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-4 group-hover:bg-[#D0F219]/20 transition-all duration-300">
                        <IconComponent size={22} className="text-[#D0F219]" />
                      </div>
                      <div className="font-heading text-2xl sm:text-3xl font-bold bg-gradient-to-r from-[#D0F219] via-lime-200 to-emerald-400 bg-clip-text text-transparent">
                        {stat.value}
                      </div>
                      <div className="mt-1 text-xs text-slate-400 font-body uppercase tracking-wider">
                        {stat.label}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          </div>
        </section>

        {/* ═══ 6.5 TAILORED FOR EVERY SECTOR ═══ */}
        <section className="py-16 lg:py-24 bg-gradient-to-b from-[#0A0D07] via-[#0F1209] to-[#0A0D07]">
          <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-center mb-14"
            >
              <div className="section-badge-lime inline-flex mx-auto mb-4">
                <Globe size={12} />
                Built For Every Business
              </div>
              <h2 className="font-heading text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight">
                Tailored for{" "}
                <span className="bg-gradient-to-r from-[#D0F219] via-lime-200 to-emerald-400 bg-clip-text text-transparent">
                  Every Sector
                </span>
              </h2>
              <p className="mt-4 text-slate-400 font-body text-sm sm:text-base max-w-xl mx-auto">
                From scaling sellers to enterprise logistics — flexible shelf
                storage that adapts to how your business moves.
              </p>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.1 }}
              variants={stagger}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {sectors.map((sector) => {
                const IconComponent = sector.icon;
                return (
                  <motion.div
                    key={sector.title}
                    variants={fadeUp}
                    className="group relative overflow-hidden rounded-3xl bg-[#12140E]/80 border border-lime-500/10 hover:border-lime-400/40 p-6 sm:p-8 transition-all duration-300 hover:-translate-y-1.5 hover:bg-[#1A1D16] hover:shadow-[0_20px_50px_rgba(208,242,25,0.08)]"
                  >
                    <div className="absolute -top-16 -right-16 w-40 h-40 rounded-full bg-[#D0F219]/[0.04] blur-2xl group-hover:bg-[#D0F219]/[0.10] transition-all duration-500 pointer-events-none" />
                    <div className="w-12 h-12 rounded-xl bg-[#D0F219]/10 border border-lime-500/20 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300">
                      <IconComponent size={22} className="text-[#D0F219]" />
                    </div>
                    <h3 className="font-heading text-lg font-semibold text-white mb-2">
                      {sector.title}
                    </h3>
                    <p className="text-sm text-slate-400 font-body leading-relaxed">
                      {sector.description}
                    </p>
                    <div className="mt-4 h-px w-full bg-gradient-to-r from-[#D0F219]/30 via-lime-400/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </section>

        {/* ═══ 7. FAQ ACCORDION ═══ */}
        <section id={SECTION_IDS.pricing} className="py-16 lg:py-24 scroll-mt-28 bg-gradient-to-b from-[#0A0D07] via-[#0F1209] to-[#0A0D07]">
          <div className="max-w-3xl mx-auto px-4 sm:px-8 lg:px-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-center mb-12"
            >
              <div className="section-badge-lime inline-flex mx-auto mb-4">
                <MessageCircle size={12} />
                Got Questions?
              </div>
              <h2 className="font-heading text-3xl sm:text-4xl font-bold text-white tracking-tight">
                Frequently Asked{" "}
                <span className="bg-gradient-to-r from-[#D0F219] via-lime-200 to-emerald-400 bg-clip-text text-transparent">
                  Questions
                </span>
              </h2>
              <p className="mt-3 text-slate-400 font-body text-sm sm:text-base">
                Everything you need to know about ByteShelf
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="bg-white/[0.04] backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-lime-500/15"
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
        <section id={SECTION_IDS.contact} className="py-16 lg:py-24 scroll-mt-28 bg-gradient-to-b from-[#0A0D07] via-[#0F1209] to-[#0A0D07]">
          <div className="max-w-3xl mx-auto px-4 sm:px-8 lg:px-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="relative overflow-hidden bg-gradient-to-br from-[#D0F219]/[0.12] via-[#12140E] to-[#0D0F0A] rounded-3xl p-8 sm:p-12 text-center shadow-2xl shadow-lime-950/30 border border-lime-500/20"
            >
              <div className="absolute -top-28 left-1/2 -translate-x-1/2 w-96 h-40 rounded-full bg-[#D0F219]/10 blur-3xl pointer-events-none" />

              <div className="relative">
                <div className="section-badge-lime inline-flex mx-auto mb-4">
                  <LayoutDashboard size={12} />
                  Get Started Today
                </div>
                <h2 className="font-heading text-2xl sm:text-3xl font-bold text-white">
                  Ready to streamline your{" "}
                  <span className="bg-gradient-to-r from-[#D0F219] via-lime-200 to-emerald-400 bg-clip-text text-transparent">
                    storage?
                  </span>
                </h2>
                <p className="mt-3 text-slate-400 font-body text-sm sm:text-base max-w-md mx-auto">
                  Join thousands of merchants and warehouse owners already using
                  ByteShelf.
                </p>
                <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                  {isLoggedIn ? (
                    <Link
                      href="/explore"
                      className="inline-flex items-center gap-2 px-8 py-3.5 bg-[#D0F219] text-[#12140E] rounded-full font-body font-semibold text-base hover:bg-lime-300 hover:shadow-[0_0_40px_rgba(208,242,25,0.4)] active:scale-95 transition-all duration-200"
                    >
                      <LayoutDashboard size={18} />
                      Explore Warehouses
                      <ArrowRight size={18} />
                    </Link>
                  ) : (
                    <>
                      <Link
                        href="/signup"
                        className="inline-flex items-center gap-2 px-8 py-3.5 bg-[#D0F219] text-[#12140E] rounded-full font-body font-semibold text-base hover:bg-lime-300 hover:shadow-[0_0_40px_rgba(208,242,25,0.4)] active:scale-95 transition-all duration-200"
                      >
                        Create Free Account
                        <ArrowRight size={18} />
                      </Link>
                      <Link
                        href="/login"
                        className="inline-flex items-center gap-2 px-8 py-3.5 border border-lime-500/30 text-lime-200 rounded-full font-body font-medium text-base hover:bg-lime-400/10 hover:border-lime-400/50 active:scale-95 transition-all duration-200"
                      >
                        Sign In
                      </Link>
                    </>
                  )}
                </div>
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
