"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Compass, CalendarDays, Package, User,
  Bell, LogOut, Menu, ArrowLeft, Loader2, MapPin, Layers,
  DollarSign, Store, Clock, CheckCircle, XCircle, CreditCard,
  Search, ChevronDown, Ban, Plus, Send, AlertCircle,
  ChevronRight, Eye, Warehouse, TrendingUp, Building2, HardHat,
  Copy, Check, Save, Phone, Box, Hash, CalendarDays as CalendarIcon,
  ChevronLeft, X, Image as ImageIcon, Edit3, Mail, PlusCircle, Download
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { logout, setUser } from "@/redux/slices/authSlice";
import { fetchNotifications } from "@/redux/slices/notificationSlice";
import { fetchProfile, updateProfile, clearProfileError, clearProfileSuccess } from "@/redux/slices/profileSlice";
import api from "@/lib/axios";
import ImageCarousel from "@/components/ui/ImageCarousel";
import ConfirmationModal from "@/components/ui/ConfirmationModal";

// ─── Types ──────────────────────────────────────────────────────────────────────

type TabId = "overview" | "explore" | "my-bookings" | "inbounds" | "account";

interface WarehouseData { _id: string; name: string; location: string; pricePerShelf: number; totalShelves: number; images: string[]; createdAt: string; latitude: number; longitude: number; }

interface BookingData {
  _id: string;
  warehouse?: { _id: string; name: string; location: string };
  warehouseName?: string; warehouseLocation?: string;
  shelfIds?: string[]; shelves?: Array<{ _id: string; shelfNumber: string }>;
  startDate: string; endDate: string; status: string; paymentStatus: string;
  totalAmount: number; pricePerShelf?: number; createdAt: string;
}

interface InboundPlanData {
  _id: string; booking: string; batchName: string; totalCartons: number;
  expectedDate: string; status: "in-transit" | "arrived" | "completed";
  createdAt: string; cartonStats?: Array<{ _id: string; count: number }>;
  warehouse?: { _id: string; name: string };
}

interface CartonData {
  _id: string; cartonCode: string; status: "in-transit" | "arrived" | "stored";
  shelf?: string | null; createdAt: string; updatedAt: string;
}

interface PlanDetail {
  plan: { _id: string; batchName: string; totalCartons: number; expectedDate: string; status: string; warehouse?: { _id: string; name: string }; createdAt: string; };
  cartons: CartonData[];
}

interface FetchResponse { warehouses: WarehouseData[]; currentPage: number; totalPages: number; totalWarehouses: number; }

// ─── Helpers ────────────────────────────────────────────────────────────────────

function formatDate(d: string) { return new Date(d).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" }); }
function formatDateTime(d: string) { return new Date(d).toLocaleString("en-PK", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }); }
function calcMonths(start: Date, end: Date): number { return Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30.44))); }
function toDateInputValue(date: Date): string { return date.toISOString().split("T")[0]; }

function statusBadge(status: string) {
  const c: Record<string, { bg: string; text: string; icon: React.ReactNode; label: string }> = {
    confirmed: { bg: "bg-emerald-500/10 border-emerald-500/20", text: "text-emerald-400", icon: <CheckCircle size={11} />, label: "Confirmed" },
    cancelled: { bg: "bg-red-500/10 border-red-500/20", text: "text-red-400", icon: <XCircle size={11} />, label: "Cancelled" },
    completed: { bg: "bg-neutral-500/10 border-neutral-500/20", text: "text-neutral-400", icon: <CheckCircle size={11} />, label: "Completed" },
    "in-transit": { bg: "bg-sky-500/10 border-sky-500/20", text: "text-sky-400", icon: <Clock size={11} />, label: "In Transit" },
    arrived: { bg: "bg-emerald-500/10 border-emerald-500/20", text: "text-emerald-400", icon: <CheckCircle size={11} />, label: "Arrived" },
    paid: { bg: "bg-emerald-500/10 border-emerald-500/20", text: "text-emerald-400", icon: <CreditCard size={11} />, label: "Paid" },
    pending: { bg: "bg-amber-500/10 border-amber-500/20", text: "text-amber-400", icon: <Clock size={11} />, label: "Pending" },
  };
  const s = c[status] || c.pending;
  return <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider border ${s.bg} ${s.text}`}>{s.icon}{s.label}</span>;
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    try { await navigator.clipboard.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch {
      const ta = document.createElement("textarea"); ta.value = value; document.body.appendChild(ta); ta.select(); document.execCommand("copy"); document.body.removeChild(ta); setCopied(true); setTimeout(() => setCopied(false), 2000);
    }
  };
  return (
    <button onClick={handleCopy} title="Copy ID" className={`p-1.5 rounded-lg border transition-all duration-200 shrink-0 ${copied ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-neutral-900/80 border-neutral-800 text-neutral-500 hover:text-white hover:bg-neutral-800/60 hover:border-neutral-700"}`}>
      {copied ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
    </button>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SIDEBAR
// ═══════════════════════════════════════════════════════════════════════════════

const SIDEBAR_TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: "overview", label: "Dashboard", icon: LayoutDashboard },
  { id: "explore", label: "Explore Warehouses", icon: Compass },
  { id: "my-bookings", label: "My Bookings", icon: CalendarDays },
  { id: "inbounds", label: "Inbounds & Cartons", icon: Package },
  { id: "account", label: "Account / Profile", icon: User },
];

function Sidebar({ activeTab, onTabChange, isOpen, onClose }: {
  activeTab: TabId; onTabChange: (id: TabId) => void; isOpen: boolean; onClose: () => void;
}) {
  const { user } = useAppSelector((s) => s.auth);
  const dispatch = useAppDispatch();
  const handleLogout = () => { dispatch(logout()); localStorage.removeItem("byteshelf_access_token"); localStorage.removeItem("auth_tokens"); window.location.href = "/login"; };

  const content = (
    <div className="flex flex-col h-full bg-[#0d100f]/95 backdrop-blur-md">
      <div className="shrink-0 px-5 pt-6 pb-5 border-b border-white/10">
        <Link href="/" className="inline-flex items-center group mb-4">
          <Image
            src="/logo.png"
            alt="ByteShelf Logo"
            width={32}
            height={32}
            className="object-contain transition-opacity duration-200 group-hover:opacity-90"
          />
          <span className="font-heading text-lg font-semibold text-white tracking-tight">ByteShelf</span>
        </Link>
        <a href="/" className="inline-flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 transition-colors font-body"><ArrowLeft size={13} /> Back to Main Site</a>
      </div>
      <nav className="flex-1 overflow-y-auto px-3 py-5 space-y-1">
        {SIDEBAR_TABS.map((tab) => {
          const Icon = tab.icon; const isActive = activeTab === tab.id;
          return (
            <button key={tab.id} onClick={() => { onTabChange(tab.id); onClose(); }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-body text-left transition-all duration-200 ${isActive ? "bg-neutral-800/90 text-[#84cc16] font-semibold border-l-2 border-[#84cc16]" : "text-white/50 hover:text-white hover:bg-white/5"}`}>
              <Icon className={isActive ? "text-[#84cc16] w-5 h-5" : "text-neutral-400 w-5 h-5"} />{tab.label}
            </button>
          );
        })}
      </nav>
      <div className="shrink-0 px-4 py-4 border-t border-white/10">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
            <span className="text-xs font-semibold text-white/70 font-body">{user?.name?.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2) || "U"}</span>
          </div>
          <div className="min-w-0 flex-1"><p className="text-sm font-medium text-white/80 font-body truncate">{user?.name || "User"}</p></div>
        </div>
        <button onClick={handleLogout} className="w-full flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm text-white/40 hover:text-red-400 hover:bg-white/5 transition-all font-body"><LogOut size={16} /> Sign Out</button>
      </div>
    </div>
  );

  return (<>
    <aside className="hidden md:flex flex-col fixed left-0 top-0 bottom-0 w-60 bg-[#0d100f]/95 backdrop-blur-md border-r border-white/10 z-40">{content}</aside>
    <AnimatePresence>{isOpen && (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={onClose}>
        <motion.aside initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }} transition={{ type: "spring", stiffness: 300, damping: 30 }} className="fixed left-0 top-0 bottom-0 w-60 bg-[#0d100f]/95 backdrop-blur-md z-50" onClick={(e) => e.stopPropagation()}>{content}</motion.aside>
      </motion.div>
    )}</AnimatePresence>
  </>);
}

// ═══════════════════════════════════════════════════════════════════════════════
// TOP HEADER
// ═══════════════════════════════════════════════════════════════════════════════

function TopHeader({ onMenuToggle, unread }: { onMenuToggle: () => void; unread: number }) {
  const { user, accessToken } = useAppSelector((s) => s.auth);
  const dispatch = useAppDispatch();
  useEffect(() => { if (accessToken) dispatch(fetchNotifications()); }, [accessToken, dispatch]);

  return (
    <header className="fixed top-0 left-0 right-0 md:left-60 z-30 h-16 bg-[#0a0d0c]/85 backdrop-blur-md border-b border-white/10">
      <div className="flex items-center justify-between h-full px-4 md:px-6">
        <div className="flex items-center gap-3">
          <button onClick={onMenuToggle} className="md:hidden w-9 h-9 rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-neutral-400 hover:text-white hover:bg-white/20 transition-all"><Menu size={18} /></button>
          <h1 className="text-sm font-semibold text-white font-body hidden sm:block">Welcome, {user?.name?.split(" ")[0] || "Merchant"}</h1>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/notifications" className="relative flex items-center justify-center w-9 h-9 rounded-full bg-white/10 border border-white/10 hover:bg-white/20 transition-colors">
            <Bell size={17} className="text-neutral-300" />
            {unread > 0 && <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 border-2 border-[#0a0d0c] text-[9px] font-bold text-white font-body shadow-sm">{unread > 99 ? "99+" : unread}</span>}
          </Link>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/10">
            <div className="w-7 h-7 rounded-full bg-[#84cc16] flex items-center justify-center">
              <span className="text-[11px] font-semibold text-black font-body">{user?.name?.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2) || "U"}</span>
            </div>
            <span className="text-sm font-medium text-white font-body hidden sm:block">{user?.name || "User"}</span>
          </div>
        </div>
      </div>
    </header>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB: OVERVIEW
// ═══════════════════════════════════════════════════════════════════════════════

function OverviewTab() {
  const { accessToken } = useAppSelector((s) => s.auth);
  const [bookings, setBookings] = useState<BookingData[]>([]);
  const [stats, setStats] = useState({ activeBookings: 0, totalSpend: 0, pendingInbounds: 0, totalInbounds: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!accessToken) return;
    let cancelled = false;
    (async () => {
      try {
        const [bkRes, inboundRes] = await Promise.all([
          api.get("/booking/my-bookings"),
          api.get("/inbound/my-plans"),
        ]);
        if (cancelled) return;
        const bkData = bkRes.data.data?.bookings || bkRes.data.data || [];
        const bookings: BookingData[] = Array.isArray(bkData) ? bkData : [];
        const inboundData = inboundRes.data.data || [];

        const active = bookings.filter((b) => b.status === "confirmed").length;
        const spend = bookings.filter((b) => b.status === "confirmed").reduce((sum, b) => sum + (b.totalAmount || 0), 0);
        const pendingIn = Array.isArray(inboundData) ? inboundData.filter((p: any) => p.status === "in-transit").length : 0;
        const totalIn = Array.isArray(inboundData) ? inboundData.length : 0;

        setBookings(bookings);
        setStats({ activeBookings: active, totalSpend: spend, pendingInbounds: pendingIn, totalInbounds: totalIn });
      } catch { } finally { if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [accessToken]);

  const recentBookings = bookings.slice(0, 5);

  return (
    <div>
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[...Array(4)].map((_, i) => <div key={i} className="bg-[#111614] rounded-2xl p-5 border border-neutral-800/80 animate-pulse"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-neutral-800/60" /><div className="space-y-2 flex-1"><div className="h-6 bg-neutral-800/60 rounded w-16" /><div className="h-3 bg-neutral-800/60 rounded w-24" /></div></div></div>)}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { icon: Building2, label: "Active Bookings", value: stats.activeBookings, sub: "Currently confirmed", delay: 0.05 },
            { icon: Package, label: "Total Inbounds", value: stats.totalInbounds, sub: `${stats.pendingInbounds} in transit`, delay: 0.1 },
            { icon: TrendingUp, label: "Cartons In Transit", value: stats.pendingInbounds, sub: "Pending arrival", delay: 0.15 },
            { icon: DollarSign, label: "Total Spend", value: `Rs. ${stats.totalSpend.toLocaleString("en-PK")}`, sub: "Across all bookings", delay: 0.2 },
          ].map((k) => (
            <motion.div key={k.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: k.delay }}
              className="bg-[#111614]/90 backdrop-blur-md rounded-2xl p-5 border border-neutral-800/80 shadow-sm hover:shadow-md hover:border-[#84cc16]/40 hover:-translate-y-1 transition-all duration-300">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-neutral-800 to-neutral-900 flex items-center justify-center shadow-sm shadow-black/20">
                  <k.icon size={20} className="text-[#84cc16]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-heading text-2xl font-bold text-white numeric tracking-tight">{k.value}</p>
                  <p className="text-xs text-neutral-400 font-body mt-0.5">{k.label}</p>
                </div>
              </div>
              {k.sub && <div className="mt-3 pt-3 border-t border-neutral-800"><span className="text-[11px] text-neutral-500 font-body">{k.sub}</span></div>}
            </motion.div>
          ))}
        </div>
      )}

      {/* Recent Activity */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.25 }}>
        <div className="flex items-center justify-between mb-5">
          <div><h2 className="font-heading text-xl font-semibold text-white">Recent Bookings</h2><p className="text-sm text-neutral-400 font-body mt-0.5">Your latest booking activity</p></div>
        </div>
        {loading ? (
          <div className="bg-[#111614]/90 backdrop-blur-md rounded-3xl border border-neutral-800/80 shadow-sm p-8 animate-pulse space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="h-10 bg-neutral-800/60 rounded-xl" />)}</div>
        ) : recentBookings.length === 0 ? (
          <div className="text-center py-16 bg-[#111614]/90 backdrop-blur-md rounded-3xl border border-neutral-800/80 shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-neutral-800/60 flex items-center justify-center mx-auto mb-4"><CalendarDays size={28} className="text-[#84cc16]/40" /></div>
            <h3 className="font-heading text-lg font-semibold text-white mb-2">No bookings yet</h3>
            <p className="text-sm text-neutral-400 font-body max-w-sm mx-auto">Explore warehouses and book shelf space to get started.</p>
          </div>
        ) : (
          <div className="bg-[#111614]/90 backdrop-blur-md rounded-3xl border border-neutral-800/80 shadow-sm overflow-hidden">
            <div className="divide-y divide-neutral-800/80">
              {recentBookings.map((b, i) => (
                <motion.div key={b._id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: i * 0.03 }}
                  className="flex items-center justify-between px-6 py-4 hover:bg-white/5 transition-colors duration-200">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-8 h-8 rounded-lg bg-neutral-800/60 flex items-center justify-center shrink-0">
                      <Store size={16} className="text-[#84cc16]" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white font-body truncate">{b.warehouse?.name || b.warehouseName || "Warehouse"}</p>
                      <div className="flex items-center gap-2 text-xs text-neutral-400 font-body">
                        <span>{formatDate(b.startDate)} – {formatDate(b.endDate)}</span>
                        <span>·</span>
                        <span>{b.shelves?.length || b.shelfIds?.length || 0} shelves</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {statusBadge(b.status)}
                    <span className="text-sm font-semibold text-white font-body numeric">Rs. {(b.totalAmount || 0).toLocaleString("en-PK")}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB: EXPLORE WAREHOUSES (Embedded Catalog)
// ═══════════════════════════════════════════════════════════════════════════════

function ExploreTab() {
  const { accessToken, user } = useAppSelector((s) => s.auth);
  const [warehouses, setWarehouses] = useState<WarehouseData[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalWarehouses, setTotalWarehouses] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  // ─── Warehouse detail slide-over state ───────────────────────────────────
  const [selectedWhId, setSelectedWhId] = useState<string | null>(null);

  const fetchWarehouses = useCallback(async (page: number, append: boolean = false) => {
    if (append) setLoadingMore(true); else setLoading(true);
    try {
      const res = await api.get(`/warehouse/all?limit=6&page=${page}`);
      const data: FetchResponse = res.data.data;
      if (append) setWarehouses((prev) => [...prev, ...(data.warehouses || [])]);
      else setWarehouses(data.warehouses || []);
      setCurrentPage(data.currentPage || page);
      setTotalPages(data.totalPages || 1);
      setTotalWarehouses(data.totalWarehouses || 0);
    } catch { } finally { setLoading(false); setLoadingMore(false); }
  }, []);

  useEffect(() => { if (accessToken) fetchWarehouses(1); }, [accessToken, fetchWarehouses]);

  const filteredWarehouses = warehouses.filter((w) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return w.name.toLowerCase().includes(q) || w.location.toLowerCase().includes(q);
  });

  const hasMore = currentPage < totalPages;
  const handleLoadMore = () => { if (!loadingMore && currentPage < totalPages) fetchWarehouses(currentPage + 1, true); };

  return (
    <div>
      {/* Search */}
      <div className="relative mb-6">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none" />
        <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by name or location..."
          className="w-full pl-11 pr-4 py-3 bg-neutral-900/80 backdrop-blur-sm border border-neutral-800 rounded-2xl text-white placeholder:text-neutral-500 focus:outline-none focus:border-[#84cc16] focus:ring-2 focus:ring-[#84cc16]/10 focus:bg-neutral-900 transition-all text-sm font-body shadow-sm shadow-black/20" />
      </div>

      {!loading && <div className="flex items-center gap-2 mb-6 text-sm text-neutral-400 font-body">
        <Package size={14} /><span>{totalWarehouses} warehouse{totalWarehouses !== 1 ? "s" : ""} available{searchQuery.trim() && ` · ${filteredWarehouses.length} match${filteredWarehouses.length !== 1 ? "es" : ""}`}</span>
      </div>}

      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => <div key={i} className="bg-[#111614] rounded-2xl overflow-hidden border border-neutral-800/80 animate-pulse"><div className="h-48 bg-neutral-800/60" /><div className="p-5 space-y-3"><div className="h-5 bg-neutral-800/60 rounded w-3/4" /><div className="h-3 bg-neutral-800/60 rounded w-1/2" /><div className="h-10 bg-neutral-800/60 rounded-full w-full" /></div></div>)}
        </div>
      )}

      {!loading && warehouses.length === 0 && (
        <div className="text-center py-16 bg-[#111614]/90 backdrop-blur-md rounded-3xl border border-neutral-800/80">
          <div className="w-16 h-16 rounded-2xl bg-neutral-800/60 flex items-center justify-center mx-auto mb-4"><Warehouse size={28} className="text-[#84cc16]/40" /></div>
          <h3 className="font-heading text-lg font-semibold text-white mb-2">No warehouses found</h3>
          <p className="text-sm text-neutral-400 font-body">Check back later!</p>
        </div>
      )}

      {!loading && filteredWarehouses.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredWarehouses.map((w, i) => (
              <motion.div key={w._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: i * 0.06 }}
                className="group bg-[#111614]/90 backdrop-blur-md border border-neutral-800/80 shadow-[0_8px_30px_rgba(0,0,0,0.4)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.5)] hover:-translate-y-1.5 hover:border-[#84cc16]/40 transition-all duration-300 rounded-3xl overflow-hidden flex flex-col">
                <ImageCarousel images={w.images || []} alt={w.name} aspectRatio="h-48" />
                <div className="p-5 flex flex-col flex-1">
                  <h3 className="font-heading text-lg font-semibold text-white">{w.name}</h3>
                  <div className="mt-1.5 flex items-center gap-1.5 text-xs text-neutral-400 font-body">
                    <MapPin size={12} /><span className="truncate">{w.location}</span>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <div><span className="font-heading text-xl font-bold text-[#84cc16] numeric">Rs. {w.pricePerShelf.toLocaleString("en-PK")}</span><span className="text-xs text-neutral-400 font-body ml-1">/shelf/mo</span></div>
                    <div className="flex items-center gap-1.5 text-xs text-neutral-400 font-body"><Layers size={13} /><span>{w.totalShelves} shelves</span></div>
                  </div>
                  <button onClick={() => setSelectedWhId(w._id)}
                    className="mt-4 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#1a231d] text-[#84cc16] border border-[#84cc16]/40 text-sm font-body font-semibold rounded-full hover:bg-[#222e26] hover:border-[#84cc16]/60 hover:shadow-lg hover:shadow-[#84cc16]/10 active:scale-95 transition-all duration-200">
                    <Eye size={15} /> View Details & Shelves
                  </button>
                </div>
              </motion.div>
            ))}
          </div>

          {hasMore && (
            <div className="mt-10 text-center">
              <button onClick={handleLoadMore} disabled={loadingMore}
                className="inline-flex items-center gap-2.5 px-8 py-3.5 bg-[#111614]/90 border border-neutral-800 text-white rounded-full font-body font-medium text-sm hover:bg-neutral-800/80 hover:border-[#84cc16]/40 transition-all duration-300 shadow-sm shadow-black/20 hover:shadow-md active:scale-[0.98] disabled:opacity-60">
                {loadingMore ? <><Loader2 size={18} className="animate-spin" /> Loading...</> : <><ChevronDown size={18} /> Load More</>}
              </button>
              <p className="mt-3 text-xs text-neutral-500 font-body">Showing {warehouses.length} of {totalWarehouses} warehouses</p>
            </div>
          )}
        </>
      )}

      {/* ═══ Warehouse Detail Slide-over Panel ═══ */}
      <AnimatePresence>
        {selectedWhId && (
          <WarehouseDetailSlideover
            warehouseId={selectedWhId}
            onClose={() => setSelectedWhId(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Warehouse Detail Slide-over ────────────────────────────────────────────────

interface ShelfData {
  _id: string;
  shelfNumber: number;
  pricePerMonth: number;
  status: "available" | "booked";
}

interface WhDetail {
  warehouse: {
    _id: string; name: string; location: string;
    latitude: number; longitude: number;
    pricePerShelf: number; totalShelves: number;
    images: string[]; createdAt: string;
  };
  available: number;
  booked: number;
}

function WarehouseDetailSlideover({ warehouseId, onClose }: { warehouseId: string; onClose: () => void }) {
  const { accessToken } = useAppSelector((s) => s.auth);
  const [detail, setDetail] = useState<WhDetail | null>(null);
  const [shelves, setShelves] = useState<ShelfData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedShelfIds, setSelectedShelfIds] = useState<string[]>([]);
  const [startDate, setStartDate] = useState(toDateInputValue(new Date()));
  const [endDate, setEndDate] = useState(toDateInputValue(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)));
  const [isBooking, setIsBooking] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!accessToken || !warehouseId) return;
    let c = false;
    (async () => {
      try {
        const [detailRes, shelfRes] = await Promise.all([
          api.get(`/warehouse/${warehouseId}`),
          api.get(`/shelf/warehouse/${warehouseId}/available`),
        ]);
        if (!c) {
          setDetail(detailRes.data.data);
          setShelves(shelfRes.data.data?.shelves || shelfRes.data.data || []);
        }
      } catch { } finally { if (!c) setLoading(false); }
    })();
    return () => { c = true; };
  }, [accessToken, warehouseId]);

  const toggleShelf = useCallback((shelfId: string) => {
    setSelectedShelfIds((prev) => prev.includes(shelfId) ? prev.filter((id) => id !== shelfId) : [...prev, shelfId]);
  }, []);

  const w = detail?.warehouse;
  const pricePerMonth = w?.pricePerShelf ?? 0;
  const start = new Date(startDate);
  const end = new Date(endDate);
  const months = start < end ? calcMonths(start, end) : 1;
  const selectedCount = selectedShelfIds.length;
  const estimatedTotal = selectedCount * pricePerMonth * months;

  const handleBooking = useCallback(async () => {
    if (selectedCount === 0) return;
    setIsBooking(true);
    setBookingError(null);
    try {
      await api.post("/booking/create", {
        warehouseId,
        shelfIds: selectedShelfIds,
        startDate,
        endDate,
      });
      setBookingSuccess(true);
      setTimeout(() => {
        setBookingSuccess(false);
        onClose();
      }, 2000);
    } catch (err: any) {
      setBookingError(err.response?.data?.message || "Booking failed.");
    } finally { setIsBooking(false); }
  }, [selectedShelfIds, warehouseId, startDate, endDate, selectedCount, onClose]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="w-full max-w-xl bg-[#111614] shadow-2xl overflow-y-auto border-l border-white/10" onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div className="sticky top-0 z-10 bg-[#111614]/90 backdrop-blur-md border-b border-neutral-800 px-6 py-4 flex items-center justify-between">
          <h2 className="font-heading text-lg font-semibold text-white">
            {loading ? "Loading..." : w?.name || "Warehouse Details"}
          </h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-neutral-400 hover:text-white hover:bg-white/20 transition-all">
            <X size={16} />
          </button>
        </div>

        {loading ? (
          <div className="p-8 animate-pulse space-y-6">
            <div className="h-48 bg-neutral-800/60 rounded-2xl" />
            <div className="h-6 bg-neutral-800/60 rounded w-3/4" />
            <div className="grid grid-cols-3 gap-4">
              <div className="h-20 bg-neutral-800/60 rounded-xl" />
              <div className="h-20 bg-neutral-800/60 rounded-xl" />
              <div className="h-20 bg-neutral-800/60 rounded-xl" />
            </div>
          </div>
        ) : !w ? (
          <div className="p-8 text-center"><AlertCircle size={32} className="mx-auto text-red-400 mb-3" /><p className="text-sm text-neutral-400">Warehouse not found.</p></div>
        ) : (
          <div className="p-6 space-y-6">
            {/* Image */}
            <ImageCarousel images={w.images || []} alt={w.name} aspectRatio="h-48" containImage={true} />

            {/* Info */}
            <div>
              <h3 className="font-heading text-xl font-bold text-white">{w.name}</h3>
              <div className="flex items-center gap-1.5 mt-1 text-sm text-neutral-400 font-body">
                <MapPin size={14} /><span>{w.location}</span>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-4 rounded-2xl bg-neutral-900/80 border border-neutral-800 text-center">
                <p className="font-heading text-xl font-bold text-white numeric">{w.totalShelves}</p>
                <p className="text-[10px] text-neutral-400 uppercase tracking-wider font-body">Total</p>
              </div>
              <div className="p-4 rounded-2xl bg-neutral-900/80 border border-neutral-800 text-center">
                <p className="font-heading text-xl font-bold text-emerald-400 numeric">{detail?.available ?? 0}</p>
                <p className="text-[10px] text-neutral-400 uppercase tracking-wider font-body">Available</p>
              </div>
              <div className="p-4 rounded-2xl bg-neutral-900/80 border border-neutral-800 text-center">
                <p className="font-heading text-xl font-bold text-white numeric">Rs. {w.pricePerShelf.toLocaleString("en-PK")}</p>
                <p className="text-[10px] text-neutral-400 uppercase tracking-wider font-body">/Shelf/Mo</p>
              </div>
            </div>

            {/* Available Shelves */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-white font-body">
                  Available Shelves <span className="text-neutral-500 font-normal">({shelves.length})</span>
                </h4>
                <div className="flex gap-1.5">
                  <button onClick={() => setSelectedShelfIds(shelves.filter(s => s.status === "available").map(s => s._id))}
                    className="text-[10px] px-2 py-1 rounded-full bg-white/10 border border-neutral-800 text-neutral-400 hover:text-white font-body">Select All</button>
                  <button onClick={() => setSelectedShelfIds([])}
                    className="text-[10px] px-2 py-1 rounded-full bg-white/10 border border-neutral-800 text-neutral-400 hover:text-white font-body">Clear</button>
                </div>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {shelves.map((shelf) => {
                  const isSelected = selectedShelfIds.includes(shelf._id);
                  return (
                    <button key={shelf._id} onClick={() => toggleShelf(shelf._id)}
                      disabled={shelf.status !== "available"}
                      className={`p-3 rounded-xl border-2 text-center transition-all duration-200 ${isSelected
                        ? "bg-[#1a231d] border-2 border-[#84cc16] text-[#84cc16] shadow-md shadow-[#84cc16]/10"
                        : shelf.status === "available"
                          ? "bg-neutral-900/60 border-neutral-800 text-white hover:border-[#84cc16]/40 hover:shadow-sm"
                          : "bg-white/5 border-neutral-800 text-neutral-600 cursor-not-allowed"
                      }`}>
                      <p className="text-xs font-semibold font-body">Shelf {shelf.shelfNumber}</p>
                      <p className={`text-[10px] mt-0.5 font-body ${isSelected ? "text-black/70" : "text-neutral-500"}`}>
                        Rs. {(shelf.pricePerMonth || pricePerMonth).toLocaleString("en-PK")}/mo
                      </p>
                    </button>
                  );
                })}
              </div>
              {shelves.length === 0 && (
                <p className="text-center py-6 text-sm text-neutral-400 font-body">No available shelves at this time.</p>
              )}
            </div>

            {/* Booking Form */}
            {shelves.length > 0 && (
              <div className="p-5 rounded-2xl bg-gradient-to-br from-neutral-800/80 to-neutral-900/80 border border-neutral-800">
                <h4 className="text-sm font-semibold text-white font-body mb-4">Book Shelves</h4>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="text-[10px] font-semibold tracking-wider text-neutral-400 uppercase mb-1 block font-body">Start Date</label>
                    <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
                      min={toDateInputValue(new Date())}
                      className="w-full px-3 py-2.5 bg-neutral-900/80 border border-neutral-800 rounded-xl text-sm text-white [color-scheme:dark] focus:outline-none focus:border-[#84cc16] transition-all font-body" />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold tracking-wider text-neutral-400 uppercase mb-1 block font-body">End Date</label>
                    <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
                      min={startDate}
                      className="w-full px-3 py-2.5 bg-neutral-900/80 border border-neutral-800 rounded-xl text-sm text-white [color-scheme:dark] focus:outline-none focus:border-[#84cc16] transition-all font-body" />
                  </div>
                </div>

                <div className="flex items-center justify-between mb-4 p-3 rounded-xl bg-neutral-900/80 border border-neutral-800">
                  <div>
                    <p className="text-xs text-neutral-400 font-body">
                      {selectedCount} shelf{selectedCount !== 1 ? "s" : ""} × {months} month{months !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <p className="font-heading text-lg font-bold text-white numeric">
                    Rs. {estimatedTotal.toLocaleString("en-PK")}
                  </p>
                </div>

                {bookingError && (
                  <div className="mb-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-2.5">
                    <AlertCircle size={14} className="text-red-400 shrink-0 mt-0.5" />
                    <p className="text-xs text-red-400 font-body">{bookingError}</p>
                  </div>
                )}

                {bookingSuccess ? (
                  <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3">
                    <CheckCircle size={20} className="text-emerald-400 shrink-0" />
                    <p className="text-sm font-semibold text-emerald-400 font-body">Booking confirmed! Redirecting...</p>
                  </div>
                ) : (
                  <button onClick={handleBooking} disabled={selectedCount === 0 || isBooking}
                    className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 bg-[#1a231d] text-[#84cc16] border border-[#84cc16]/40 rounded-full text-sm font-body font-semibold hover:bg-[#222e26] hover:border-[#84cc16]/60 hover:shadow-lg hover:shadow-[#84cc16]/10 active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed">
                    {isBooking ? <><Loader2 size={16} className="animate-spin" />Booking...</> : <><Eye size={16} />Book {selectedCount > 0 ? `${selectedCount} Shelf${selectedCount > 1 ? "s" : ""}` : "Shelves"}</>}
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB: MY BOOKINGS
// ═══════════════════════════════════════════════════════════════════════════════

function MyBookingsTab({ onTabChange }: { onTabChange: (tab: TabId) => void }) {
  const router = useRouter();
  const { accessToken } = useAppSelector((s) => s.auth);
  const [bookings, setBookings] = useState<BookingData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<BookingData | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelTarget, setCancelTarget] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelSuccess, setCancelSuccess] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");

  // ─── Inbound Creation from Booking ──────────────────────────────────────
  const [showInboundModal, setShowInboundModal] = useState(false);
  const [inboundBooking, setInboundBooking] = useState<BookingData | null>(null);
  const [inboundCartons, setInboundCartons] = useState(1);
  const [inboundArrivalDate, setInboundArrivalDate] = useState("");
  const [inboundBatchName, setInboundBatchName] = useState("");
  const [creatingInbound, setCreatingInbound] = useState(false);
  const [inboundCreateError, setInboundCreateError] = useState<string | null>(null);
  const [createdPlanId, setCreatedPlanId] = useState<string | null>(null);
  const [showInboundSuccess, setShowInboundSuccess] = useState(false);

  const fetchBookings = useCallback(async () => {
    if (!accessToken) return;
    try {
      const res = await api.get("/booking/my-bookings");
      const data = res.data.data?.bookings || res.data.data || [];
      setBookings(Array.isArray(data) ? data : []);
    } catch { } finally { setLoading(false); }
  }, [accessToken]);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  const handleCancelBooking = useCallback(async (reason?: string) => {
    if (!cancelTarget) return;
    setIsCancelling(true);
    try {
      await api.post(`/booking/cancel/${cancelTarget}`, { reason: reason || "" });
      setShowCancelConfirm(false);
      setCancelSuccess("Booking cancelled successfully.");
      fetchBookings();
      setTimeout(() => setCancelSuccess(null), 3000);
    } catch { } finally { setIsCancelling(false); setCancelTarget(null); }
  }, [cancelTarget, fetchBookings]);

  // ─── Handle Create Inbound from Booking ─────────────────────────────────
  const handleCreateInboundFromBooking = useCallback(async () => {
    if (!inboundBooking || !inboundBatchName.trim() || !inboundCartons || !inboundArrivalDate) return;
    setCreatingInbound(true);
    setInboundCreateError(null);
    try {
      const res = await api.post("/inbound/create", {
        bookingId: inboundBooking._id,
        batchName: inboundBatchName.trim(),
        totalCartons: inboundCartons,
        expectedDate: inboundArrivalDate,
      });
      const planId = res.data.data?._id || "";
      setCreatedPlanId(planId);
      setShowInboundModal(false);
      setShowInboundSuccess(true);
      setInboundBatchName("");
      setInboundCartons(1);
      setInboundArrivalDate("");
      setInboundBooking(null);
      fetchBookings();
    } catch (err: any) {
      setInboundCreateError(err.response?.data?.message || "Failed to create inbound plan.");
    } finally { setCreatingInbound(false); }
  }, [inboundBooking, inboundBatchName, inboundCartons, inboundArrivalDate, fetchBookings]);

  const openInboundModal = useCallback((booking: BookingData) => {
    setInboundBooking(booking);
    setInboundCartons(1);
    setInboundArrivalDate("");
    setInboundBatchName(`Shipment - ${booking.warehouseName || booking.warehouse?.name || "Warehouse"}`);
    setInboundCreateError(null);
    setShowInboundModal(true);
  }, []);

  const filteredBookings = bookings.filter((b) => {
    if (filterStatus === "all") return true;
    return b.status === filterStatus;
  });

  return (
    <div>
      {/* Cancel Success Toast */}
      <AnimatePresence>{cancelSuccess && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
          className="mb-6 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3">
          <CheckCircle size={18} className="text-emerald-400 shrink-0" />
          <p className="text-sm text-emerald-400 font-body">{cancelSuccess}</p>
        </motion.div>
      )}</AnimatePresence>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 mb-6 overflow-x-auto">
        {["all", "confirmed", "pending", "cancelled"].map((tab) => {
          const isActive = filterStatus === tab;
          return (
            <button key={tab} onClick={() => setFilterStatus(tab)}
              className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-body font-medium transition-all duration-200 ${isActive ? "bg-[#1a231d] text-[#84cc16] border border-[#84cc16]/40 font-semibold shadow-lg shadow-[#84cc16]/10" : "bg-white/5 border border-neutral-800 text-neutral-400 hover:text-white hover:border-[#84cc16]/40"}`}>
              {tab === "all" ? "All" : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2].map((i) => <div key={i} className="bg-[#111614] rounded-2xl p-5 border border-neutral-800/80 animate-pulse"><div className="h-5 bg-neutral-800/60 rounded w-3/4 mb-3" /><div className="h-3 bg-neutral-800/60 rounded w-1/2 mb-4" /><div className="h-8 bg-neutral-800/60 rounded-full w-1/3" /></div>)}
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="text-center py-16 bg-[#111614]/90 backdrop-blur-md rounded-3xl border border-neutral-800/80 shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-neutral-800/60 flex items-center justify-center mx-auto mb-4"><CalendarDays size={28} className="text-[#84cc16]/40" /></div>
          <h3 className="font-heading text-lg font-semibold text-white mb-2">No {filterStatus !== "all" ? filterStatus : ""} bookings found</h3>
          <p className="text-sm text-neutral-400 font-body mb-6">Browse available warehouses to book shelf space.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredBookings.map((b, i) => {
            const canCancel = b.status !== "cancelled";
            return (
              <motion.div key={b._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: i * 0.04 }}
                className="bg-[#111614]/90 backdrop-blur-md border border-neutral-800/80 shadow-[0_8px_30px_rgba(0,0,0,0.4)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.5)] hover:-translate-y-1 hover:border-[#84cc16]/40 transition-all duration-300 rounded-3xl overflow-hidden flex flex-col">
                <div className="p-5 flex flex-col flex-1">
                  <div className="flex items-center gap-2 mb-3 flex-wrap">
                    {statusBadge(b.status)}
                    {statusBadge(b.paymentStatus === "paid" ? "paid" : "pending")}
                  </div>
                  <h3 className="font-heading text-lg font-semibold text-white">{b.warehouseName || b.warehouse?.name || "Warehouse Booking"}</h3>
                  {(b.warehouseLocation || b.warehouse?.location) && (
                    <div className="flex items-center gap-1.5 mt-1 text-xs text-neutral-400 font-body"><MapPin size={12} /><span className="truncate">{b.warehouseLocation || b.warehouse?.location}</span></div>
                  )}
                  <hr className="my-4 border-white/10" />
                  <div className="flex items-center justify-between text-xs text-neutral-400 font-body">
                    <CalendarDays size={13} /><span>{formatDate(b.startDate)} – {formatDate(b.endDate)}</span>
                    <div className="flex items-center gap-1"><Layers size={13} /><span>{b.shelves?.length || b.shelfIds?.length || 0} shelves</span></div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between">
                    <span className="font-heading text-lg font-bold text-white numeric">Rs. {(b.totalAmount || 0).toLocaleString("en-PK")}</span>
                    <span className="text-[10px] text-neutral-500 font-body">ID: {b._id.slice(-8)}</span>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <button onClick={() => setSelectedBooking(b)}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 border border-[#84cc16]/30 text-[#84cc16] rounded-full text-xs font-medium hover:bg-[#84cc16]/10 transition-colors">
                      <Eye size={13} /> View Details
                    </button>
                    {b.status === "confirmed" && (
                      <button onClick={() => openInboundModal(b)}
                        className="flex-[1.5] inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-[#1a231d] text-[#84cc16] border border-[#84cc16]/40 rounded-full text-xs font-semibold hover:bg-[#222e26] hover:border-[#84cc16]/60 hover:shadow-lg hover:shadow-[#84cc16]/10 active:scale-95 transition-all duration-200">
                        <Package size={13} /> Create Inbound
                      </button>
                    )}
                    {canCancel && (
                      <button onClick={() => { setCancelTarget(b._id); setShowCancelConfirm(true); }}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 border-2 border-red-500/30 text-red-400 rounded-full text-xs font-medium hover:bg-red-500/10 transition-all">
                        <Ban size={13} /> Cancel
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Booking Details Modal */}
      <AnimatePresence>
        {selectedBooking && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-16 sm:pt-20 bg-black/70 backdrop-blur-sm overflow-y-auto"
            onClick={(e) => { if (e.target === e.currentTarget) setSelectedBooking(null); }}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-lg bg-[#111614] rounded-3xl shadow-2xl border border-neutral-800/80 overflow-hidden relative" onClick={(e) => e.stopPropagation()}>
              <button onClick={() => setSelectedBooking(null)} className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/10 border border-neutral-800 flex items-center justify-center text-neutral-400 hover:bg-white/20 hover:text-white transition-all z-10"><X size={16} /></button>
              <div className="p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-2xl bg-[#84cc16] flex items-center justify-center shrink-0">
                    <Store size={20} className="text-black" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="font-heading text-lg font-semibold text-white truncate">{selectedBooking.warehouseName || selectedBooking.warehouse?.name || "Warehouse"}</h2>
                    <p className="text-xs text-neutral-400 font-body">{selectedBooking.warehouseLocation || selectedBooking.warehouse?.location || ""}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 mb-4">
                  {statusBadge(selectedBooking.status)}
                  {statusBadge(selectedBooking.paymentStatus === "paid" ? "paid" : "pending")}
                </div>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="p-3 rounded-xl bg-neutral-900/80 border border-neutral-800">
                    <p className="text-[10px] font-semibold tracking-wider text-neutral-400 uppercase mb-1 font-body">Start Date</p>
                    <p className="text-sm font-semibold text-white font-body">{formatDate(selectedBooking.startDate)}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-neutral-900/80 border border-neutral-800">
                    <p className="text-[10px] font-semibold tracking-wider text-neutral-400 uppercase mb-1 font-body">End Date</p>
                    <p className="text-sm font-semibold text-white font-body">{formatDate(selectedBooking.endDate)}</p>
                  </div>
                </div>
                <div className="p-4 rounded-2xl bg-gradient-to-br from-neutral-800/80 to-neutral-900/80 border border-neutral-800 flex items-center justify-between">
                  <span className="text-sm font-medium text-white font-body">Total Amount</span>
                  <span className="font-heading text-xl font-bold text-white numeric">Rs. {(selectedBooking.totalAmount || 0).toLocaleString("en-PK")}</span>
                </div>
                {selectedBooking.shelves && selectedBooking.shelves.length > 0 && (
                  <div className="mt-4">
                    <p className="text-[10px] font-semibold tracking-wider text-neutral-400 uppercase mb-2 font-body">Booked Shelves</p>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedBooking.shelves.map((shelf) => (
                        <span key={shelf._id} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/5 border border-neutral-800 text-[11px] font-body"><Layers size={11} className="text-[#84cc16]" /><span className="font-medium text-white">{shelf.shelfNumber}</span></span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ INBOUND CREATION MODAL ═══ */}
      <AnimatePresence>
        {showInboundModal && inboundBooking && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-16 sm:pt-20 bg-black/70 backdrop-blur-sm overflow-y-auto"
            onClick={(e) => { if (e.target === e.currentTarget) { setShowInboundModal(false); setInboundBooking(null); } }}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-lg bg-[#111614] rounded-3xl shadow-2xl border border-neutral-800/80 overflow-hidden" onClick={(e) => e.stopPropagation()}>
              <div className="p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                    <Package size={20} className="text-emerald-400" />
                  </div>
                  <div>
                    <h2 className="font-heading text-lg font-semibold text-white">Create Inbound Shipment</h2>
                    <p className="text-xs text-neutral-400 font-body">for {inboundBooking.warehouseName || inboundBooking.warehouse?.name || "Booking"}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold tracking-wider text-white uppercase mb-1.5 block font-body">Batch Name</label>
                    <input type="text" value={inboundBatchName} onChange={(e) => setInboundBatchName(e.target.value)}
                      placeholder="e.g. Q4 Inventory Restock"
                      className="w-full px-4 py-3 bg-neutral-900/80 border border-neutral-800 rounded-xl text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:border-[#84cc16] focus:bg-neutral-900 transition-all font-body" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold tracking-wider text-white uppercase mb-1.5 block font-body">Total Cartons</label>
                      <input type="number" min={1} value={inboundCartons}
                        onChange={(e) => setInboundCartons(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-full px-4 py-3 bg-neutral-900/80 border border-neutral-800 rounded-xl text-sm text-white [color-scheme:dark] focus:outline-none focus:border-[#84cc16] focus:bg-neutral-900 transition-all font-body" />
                    </div>
                    <div>
                      <label className="text-xs font-semibold tracking-wider text-white uppercase mb-1.5 block font-body">Arrival Date</label>
                      <input type="date" value={inboundArrivalDate}
                        onChange={(e) => setInboundArrivalDate(e.target.value)}
                        min={new Date().toISOString().split("T")[0]}
                        className="w-full px-4 py-3 bg-neutral-900/80 border border-neutral-800 rounded-xl text-sm text-white [color-scheme:dark] focus:outline-none focus:border-[#84cc16] focus:bg-neutral-900 transition-all font-body" />
                    </div>
                  </div>

                  {inboundCreateError && (
                    <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-2.5">
                      <AlertCircle size={14} className="text-red-400 shrink-0 mt-0.5" />
                      <p className="text-xs text-red-400 font-body">{inboundCreateError}</p>
                    </div>
                  )}

                  <div className="flex items-center gap-3 pt-2">
                    <button onClick={handleCreateInboundFromBooking}
                      disabled={creatingInbound || !inboundBatchName.trim() || !inboundArrivalDate}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-[#1a231d] text-[#84cc16] border border-[#84cc16]/40 rounded-full text-sm font-body font-semibold hover:bg-[#222e26] hover:border-[#84cc16]/60 hover:shadow-lg hover:shadow-[#84cc16]/10 active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm">
                      {creatingInbound ? <><Loader2 size={16} className="animate-spin" />Creating...</> : <><Send size={16} />Create Shipment</>}
                    </button>
                    <button onClick={() => { setShowInboundModal(false); setInboundBooking(null); }}
                      className="px-5 py-3 border border-neutral-800 text-neutral-400 rounded-full text-sm font-body hover:bg-white/5 transition-colors">Cancel</button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ INBOUND SUCCESS MODAL ═══ */}
      <AnimatePresence>
        {showInboundSuccess && createdPlanId && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            onClick={(e) => { if (e.target === e.currentTarget) setShowInboundSuccess(false); }}>
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-md bg-[#111614] rounded-3xl shadow-2xl border border-neutral-800/80 p-8 text-center" onClick={(e) => e.stopPropagation()}>
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={28} className="text-emerald-400" />
              </div>
              <h2 className="font-heading text-xl font-bold text-white mb-2">Inbound Plan Created!</h2>
              <p className="text-sm text-neutral-400 font-body mb-5">Your shipment has been created and the warehouse owner will be notified.</p>
              
              <div className="flex items-center justify-between bg-neutral-900/80 border border-neutral-800 rounded-xl p-3 mb-5">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-[10px] text-neutral-500 uppercase font-semibold tracking-wider font-body">PLAN ID:</span>
                  <code className="text-xs font-mono text-neutral-300 font-medium break-all">{createdPlanId}</code>
                </div>
                <CopyButton value={createdPlanId} />
              </div>

              <div className="flex gap-3">
                <button onClick={() => { setShowInboundSuccess(false); onTabChange("inbounds"); }}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 bg-[#1a231d] text-[#84cc16] border border-[#84cc16]/40 rounded-full text-sm font-body font-semibold hover:bg-[#222e26] hover:border-[#84cc16]/60 hover:shadow-lg hover:shadow-[#84cc16]/10 active:scale-95 transition-all duration-200">
                  <Package size={16} /> View Inbounds
                </button>
                <button onClick={() => setShowInboundSuccess(false)}
                  className="px-5 py-3 border border-neutral-800 text-neutral-400 rounded-full text-sm font-body hover:bg-white/5 transition-colors">Close</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cancel Confirmation */}
      <AnimatePresence>
        {showCancelConfirm && (
          <ConfirmationModal
            title="Cancel Booking?"
            message="Are you sure you want to cancel this booking? This action cannot be undone."
            confirmLabel="Yes, Cancel Booking"
            cancelLabel="No, Keep Booking"
            variant="danger"
            showReasonInput
            reasonPlaceholder="Reason for cancellation (Optional)"
            onConfirm={handleCancelBooking}
            onCancel={() => { setShowCancelConfirm(false); setCancelTarget(null); }}
            isLoading={isCancelling}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB: INBOUNDS & CARTONS
// ═══════════════════════════════════════════════════════════════════════════════

function InboundsTab({ onTabChange }: { onTabChange: (tab: TabId) => void }) {
  const { accessToken } = useAppSelector((s) => s.auth);
  const [plans, setPlans] = useState<InboundPlanData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<PlanDetail | null>(null);
  const [planLoading, setPlanLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [bookings, setBookings] = useState<BookingData[]>([]);
  const [batchName, setBatchName] = useState("");
  const [totalCartons, setTotalCartons] = useState(1);
  const [expectedDate, setExpectedDate] = useState("");
  const [selectedBookingId, setSelectedBookingId] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // ─── Search & Add Cartons state ─────────────────────────────────────────
  const [inboundSearch, setInboundSearch] = useState("");
  const [addCartonsPlan, setAddCartonsPlan] = useState<InboundPlanData | null>(null);
  const [addCartonsCount, setAddCartonsCount] = useState(1);
  const [isAddingCartons, setIsAddingCartons] = useState(false);
  const [addCartonsError, setAddCartonsError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    let c = false;
    (async () => {
      try {
        const [planRes, bkRes] = await Promise.all([
          api.get("/inbound/my-plans"),
          api.get("/booking/my-bookings"),
        ]);
        if (c) return;
        const planData = planRes.data.data || [];
        setPlans(Array.isArray(planData) ? planData : []);
        const bkData = bkRes.data.data?.bookings || bkRes.data.data || [];
        setBookings(Array.isArray(bkData) ? bkData.filter((b: BookingData) => b.status === "confirmed") : []);
      } catch { } finally { if (!c) setLoading(false); }
    })();
    return () => { c = true; };
  }, [accessToken]);

  const handleViewPlan = useCallback(async (planId: string) => {
    setPlanLoading(true);
    setSelectedPlan(null);
    try {
      const res = await api.get(`/inbound/${planId}`);
      setSelectedPlan(res.data.data);
    } catch { } finally { setPlanLoading(false); }
  }, []);

  const handleCreateInbound = useCallback(async () => {
    if (!batchName.trim() || !totalCartons || !expectedDate || !selectedBookingId) return;
    setCreating(true);
    setCreateError(null);
    try {
      await api.post("/inbound/create", { bookingId: selectedBookingId, batchName: batchName.trim(), totalCartons, expectedDate });
      setShowCreateForm(false);
      setBatchName(""); setTotalCartons(1); setExpectedDate(""); setSelectedBookingId("");
      const res = await api.get("/inbound/my-plans");
      setPlans(Array.isArray(res.data.data) ? res.data.data : []);
    } catch (err: any) {
      setCreateError(err.response?.data?.message || "Failed to create inbound plan.");
    } finally { setCreating(false); }
  }, [batchName, totalCartons, expectedDate, selectedBookingId]);

  // ─── Handle Add Cartons ─────────────────────────────────────────────────
  const [addCartonsSuccess, setAddCartonsSuccess] = useState<string | null>(null);

  const handleAddCartons = useCallback(async () => {
    if (!addCartonsPlan || addCartonsCount < 1) return;
    setIsAddingCartons(true);
    setAddCartonsError(null);
    setAddCartonsSuccess(null);
    try {
      const res = await api.post(`/carton/add/${addCartonsPlan._id}`, { count: addCartonsCount });
      const added = res.data.data?.addedCount || addCartonsCount;
      setAddCartonsSuccess(`${added} carton(s) added successfully!`);
      // Close the add cartons modal
      setAddCartonsPlan(null);
      setAddCartonsCount(1);
      // Update local state immediately instead of full refetch
      setPlans((prev) =>
        prev.map((p) =>
          p._id === addCartonsPlan._id
            ? { ...p, totalCartons: res.data.data?.totalCartons || p.totalCartons + addCartonsCount }
            : p
        )
      );
      // Auto-clear success toast after 3 seconds
      setTimeout(() => setAddCartonsSuccess(null), 3000);
    } catch (err: any) {
      const serverMsg = err.response?.data?.message;
      const fallbackMsg = err.message || "Failed to add cartons";
      setAddCartonsError(serverMsg || fallbackMsg);
    } finally { setIsAddingCartons(false); }
  }, [addCartonsPlan, addCartonsCount]);

  // ─── Filtered plans (search by ID or Warehouse Name) ─────────────────────
  const filteredPlans = plans.filter((p) => {
    if (!inboundSearch.trim()) return true;
    const q = inboundSearch.toLowerCase();
    return p._id.toLowerCase().includes(q) || (p.warehouse?.name || "").toLowerCase().includes(q) || p.batchName.toLowerCase().includes(q);
  });

  const activeBookings = bookings.filter((b) => b.status === "confirmed");

  // Summary stats
  const totalPlans = plans.length;
  const inTransitCount = plans.filter((p) => p.status === "in-transit").length;
  const arrivedCount = plans.filter((p) => p.status === "arrived" || p.status === "completed").length;
  const totalCartonCount = plans.reduce((sum, p) => sum + p.totalCartons, 0);

  return (
    <div>
      {/* Summary Stats */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { icon: Package, label: "Total Plans", value: totalPlans },
          { icon: Box, label: "Total Cartons", value: totalCartonCount },
          { icon: Clock, label: "In Transit", value: inTransitCount },
          { icon: CheckCircle, label: "Arrived", value: arrivedCount },
        ].map((k) => (
          <div key={k.label} className="bg-[#111614]/90 backdrop-blur-md rounded-2xl p-4 border border-neutral-800/80 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-neutral-800/60 flex items-center justify-center"><k.icon size={18} className="text-[#84cc16]" /></div>
              <div><p className="font-heading text-xl font-bold text-white numeric">{k.value}</p><p className="text-[11px] text-neutral-400 font-body">{k.label}</p></div>
            </div>
          </div>
        ))}
      </motion.div>

      {/* Search Bar */}
      <div className="relative mb-5">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none" />
        <input type="text" value={inboundSearch} onChange={(e) => setInboundSearch(e.target.value)}
          placeholder="Search by Plan ID, Warehouse Name, or Batch Name..."
          className="w-full pl-10 pr-4 py-2.5 bg-neutral-900/80 backdrop-blur-sm border border-neutral-800 rounded-xl text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:border-[#84cc16] focus:ring-2 focus:ring-[#84cc16]/10 focus:bg-neutral-900 transition-all font-body shadow-sm shadow-black/20" />
      </div>

      {/* Create Button & results count */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="font-heading text-lg font-semibold text-white">Inbound Plans</h2>
          <p className="text-sm text-neutral-400 font-body">
            Track incoming inventory
            {inboundSearch.trim() && filteredPlans.length > 0 && ` · ${filteredPlans.length} match${filteredPlans.length !== 1 ? "es" : ""}`}
          </p>
        </div>
        {/* <button onClick={() => setShowCreateForm(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#1a231d] text-[#84cc16] border border-[#84cc16]/40 rounded-full text-xs font-body font-semibold hover:bg-[#222e26] hover:border-[#84cc16]/60 hover:shadow-lg hover:shadow-[#84cc16]/10 active:scale-95 transition-all duration-200">
          <Plus size={14} /> New Inbound Plan
        </button> */}
      </div>

      {/* Loading */}
      {loading && (
        <div className="bg-[#111614]/90 backdrop-blur-md rounded-3xl border border-neutral-800/80 shadow-sm p-8 animate-pulse space-y-4">
          {[1, 2, 3].map((i) => <div key={i} className="h-16 bg-neutral-800/60 rounded-xl" />)}
        </div>
      )}

      {/* Empty state when no plans at all */}
      {!loading && plans.length === 0 && !showCreateForm && (
        <div className="text-center py-16 bg-[#111614]/90 backdrop-blur-md rounded-3xl border border-neutral-800/80 shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-neutral-800/60 flex items-center justify-center mx-auto mb-4"><Package size={28} className="text-[#84cc16]/40" /></div>
          <h3 className="font-heading text-lg font-semibold text-white mb-2">No inbound plans yet</h3>
          <p className="text-sm text-neutral-400 font-body mb-6">Create your first inbound shipment plan to start tracking inventory.</p>
        </div>
      )}

      {/* Empty search results */}
      {!loading && plans.length > 0 && filteredPlans.length === 0 && (
        <div className="text-center py-12 bg-[#111614]/90 backdrop-blur-md rounded-3xl border border-neutral-800/80 shadow-sm">
          <Search size={28} className="mx-auto text-[#84cc16]/30 mb-3" />
          <p className="text-sm text-neutral-400 font-body">No inbound plans match your search.</p>
          <button onClick={() => setInboundSearch("")} className="mt-3 text-xs text-[#84cc16] font-body hover:underline">Clear search</button>
        </div>
      )}

      {/* Plans List */}
      {!loading && filteredPlans.length > 0 && (
        <div className="bg-[#111614]/90 backdrop-blur-md rounded-3xl border border-neutral-800/80 shadow-sm overflow-hidden mb-6">
          <div className="divide-y divide-neutral-800/80">
            {filteredPlans.map((plan, i) => {
              const stats = plan.cartonStats || [];
              const tn = stats.find((s) => s._id === "in-transit")?.count || 0;
              const ar = stats.find((s) => s._id === "arrived")?.count || 0;
              const st = stats.find((s) => s._id === "stored")?.count || 0;
              return (
                <motion.div key={plan._id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: i * 0.03 }}
                  className="px-5 py-4 hover:bg-white/5 transition-colors duration-200">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-sm text-white font-body">{plan.batchName}</span>
                        {statusBadge(plan.status)}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-neutral-400 font-body">
                        <span className="flex items-center gap-1"><Box size={12} />{plan.totalCartons} cartons</span>
                        <span>·</span>
                        <span className="flex items-center gap-1"><CalendarIcon size={12} />Expected: {formatDate(plan.expectedDate)}</span>
                        {plan.warehouse?.name && <><span>·</span><span className="flex items-center gap-1"><Warehouse size={12} />{plan.warehouse.name}</span></>}
                      </div>
                      {(tn > 0 || ar > 0 || st > 0) && (
                        <div className="flex items-center gap-3 mt-2 text-[11px] text-neutral-400 font-body">
                          {tn > 0 && <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400" />{tn} in transit</span>}
                          {ar > 0 && <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400" />{ar} arrived</span>}
                          {st > 0 && <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400" />{st} stored</span>}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {plan.status === "in-transit" && (
                        <button onClick={() => { setAddCartonsPlan(plan); setAddCartonsCount(1); setAddCartonsError(null); }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full text-xs font-medium hover:bg-emerald-500/20 transition-colors">
                          <PlusCircle size={12} /> Add Cartons
                        </button>
                      )}
                      <button onClick={() => handleViewPlan(plan._id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-[#84cc16]/30 text-[#84cc16] rounded-full text-xs font-medium hover:bg-[#84cc16]/10 transition-colors">
                        <Eye size={13} /> View
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Create Form (hidden panel) */}
      <AnimatePresence>
        {showCreateForm && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            className="bg-[#111614]/90 backdrop-blur-md rounded-3xl p-6 border border-neutral-800/80 shadow-sm mb-6">
            <h3 className="font-heading text-lg font-semibold text-white mb-5">Create Inbound Plan</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold tracking-wider text-white uppercase mb-1.5 block font-body">Active Booking</label>
                <select value={selectedBookingId} onChange={(e) => setSelectedBookingId(e.target.value)}
                  className="w-full px-4 py-3 bg-neutral-900/80 border border-neutral-800 rounded-xl text-sm text-white [color-scheme:dark] focus:outline-none focus:border-[#84cc16] focus:bg-neutral-900 transition-all font-body">
                  <option value="">Select a booking...</option>
                  {activeBookings.map((b) => (
                    <option key={b._id} value={b._id}>{b.warehouseName || b.warehouse?.name || "Warehouse"} – {formatDate(b.startDate)}</option>
                  ))}
                </select>
                {activeBookings.length === 0 && <p className="text-xs text-amber-400 font-body mt-1">No active bookings. Book a warehouse first.</p>}
              </div>
              <div>
                <label className="text-xs font-semibold tracking-wider text-white uppercase mb-1.5 block font-body">Batch Name</label>
                <input type="text" value={batchName} onChange={(e) => setBatchName(e.target.value)} placeholder="e.g. Q4 Inventory Restock"
                  className="w-full px-4 py-3 bg-neutral-900/80 border border-neutral-800 rounded-xl text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:border-[#84cc16] focus:bg-neutral-900 transition-all font-body" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold tracking-wider text-white uppercase mb-1.5 block font-body">Total Cartons</label>
                  <input type="number" min={1} value={totalCartons} onChange={(e) => setTotalCartons(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full px-4 py-3 bg-neutral-900/80 border border-neutral-800 rounded-xl text-sm text-white [color-scheme:dark] focus:outline-none focus:border-[#84cc16] focus:bg-neutral-900 transition-all font-body" />
                </div>
                <div>
                  <label className="text-xs font-semibold tracking-wider text-white uppercase mb-1.5 block font-body">Expected Date</label>
                  <input type="date" value={expectedDate} onChange={(e) => setExpectedDate(e.target.value)} min={new Date().toISOString().split("T")[0]}
                    className="w-full px-4 py-3 bg-neutral-900/80 border border-neutral-800 rounded-xl text-sm text-white [color-scheme:dark] focus:outline-none focus:border-[#84cc16] focus:bg-neutral-900 transition-all font-body" />
                </div>
              </div>
              {createError && <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-2.5"><AlertCircle size={14} className="text-red-400 shrink-0 mt-0.5" /><p className="text-xs text-red-400 font-body">{createError}</p></div>}
              <div className="flex items-center gap-3 pt-2">
                <button onClick={handleCreateInbound} disabled={creating || !batchName.trim() || !expectedDate || !selectedBookingId}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-[#1a231d] text-[#84cc16] border border-[#84cc16]/40 rounded-full text-sm font-body font-semibold hover:bg-[#222e26] hover:border-[#84cc16]/60 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm">
                  {creating ? <><Loader2 size={16} className="animate-spin" />Creating...</> : <><Send size={16} />Create Inbound Plan</>}
                </button>
                <button onClick={() => setShowCreateForm(false)} className="px-5 py-3 border border-neutral-800 text-neutral-400 rounded-full text-sm font-body hover:bg-white/5 transition-colors">Cancel</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ ADD CARTONS SUCCESS TOAST ═══ */}
      <AnimatePresence>
        {addCartonsSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-4 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3"
          >
            <CheckCircle size={18} className="text-emerald-400 shrink-0" />
            <p className="text-sm font-semibold text-emerald-400 font-body">{addCartonsSuccess}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ ADD CARTONS MODAL ═══ */}
      <AnimatePresence>
        {addCartonsPlan && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            onClick={(e) => { if (e.target === e.currentTarget) setAddCartonsPlan(null); }}>
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-sm bg-[#111614] rounded-3xl shadow-2xl border border-neutral-800/80 p-6" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                  <Package size={20} className="text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-heading text-lg font-semibold text-white">Add Cartons</h3>
                  <p className="text-xs text-neutral-400 font-body truncate">{addCartonsPlan.batchName}</p>
                </div>
              </div>
              <div className="mb-4">
                <label className="text-xs font-semibold tracking-wider text-white uppercase mb-1.5 block font-body">Number of Cartons to Add</label>
                <input type="number" min={1} value={addCartonsCount}
                  onChange={(e) => setAddCartonsCount(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-4 py-3 bg-neutral-900/80 border border-neutral-800 rounded-xl text-sm text-white [color-scheme:dark] focus:outline-none focus:border-[#84cc16] focus:bg-neutral-900 transition-all font-body" />
              </div>
              {addCartonsError && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-2.5">
                  <AlertCircle size={14} className="text-red-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-red-400 font-body">{addCartonsError}</p>
                </div>
              )}
              <div className="flex items-center gap-3 pt-1">
                <button onClick={handleAddCartons} disabled={isAddingCartons || addCartonsCount < 1}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-[#1a231d] text-[#84cc16] border border-[#84cc16]/40 rounded-full text-sm font-body font-semibold hover:bg-[#222e26] hover:border-[#84cc16]/60 hover:shadow-lg hover:shadow-[#84cc16]/10 active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm">
                  {isAddingCartons ? <><Loader2 size={16} className="animate-spin" />Adding...</> : <><PlusCircle size={16} />Add Cartons</>}
                </button>
                <button onClick={() => setAddCartonsPlan(null)}
                  className="px-5 py-3 border border-neutral-800 text-neutral-400 rounded-full text-sm font-body hover:bg-white/5 transition-colors">Cancel</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Plan Detail Modal */}
      <AnimatePresence>
        {selectedPlan && (
          <PlanDetailModal plan={selectedPlan} onClose={() => setSelectedPlan(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Plan Detail Modal ──────────────────────────────────────────────────────────

function PlanDetailModal({ plan, onClose }: { plan: PlanDetail; onClose: () => void }) {
  const { plan: p, cartons } = plan;
  const arrived = cartons.filter((c) => c.status === "arrived" || c.status === "stored").length;
  const inTransit = cartons.filter((c) => c.status === "in-transit").length;
  const stored = cartons.filter((c) => c.status === "stored").length;

  // ─── QR Code PDF Download ────────────────────────────────────────────────
  const [pdfGenerating, setPdfGenerating] = useState(false);

  const handleDownloadPDF = useCallback(async () => {
    if (cartons.length === 0) return;
    setPdfGenerating(true);
    try {
      const QRCode = (await import("qrcode")).default;
      const { jsPDF } = await import("jspdf");

      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pageW = 210; // A4 width in mm
      const margin = 12;
      const cols = 3;
      const labelW = (pageW - margin * 2) / cols;
      const labelH = 55;
      const qrSize = 28;

      doc.setFontSize(18);
      doc.text(`QR Labels - ${p.batchName}`, margin, 18);
      doc.setFontSize(9);
      doc.text(`Plan ID: ${p._id}`, margin, 24);
      doc.text(`Total: ${cartons.length} carton(s)`, margin, 29);

      let x = margin;
      let y = 38;

      for (let i = 0; i < cartons.length; i++) {
        const carton = cartons[i];
        // Generate QR code as data URL
        const qrDataUrl = await QRCode.toDataURL(carton.cartonCode, {
          width: 200,
          margin: 1,
          color: { dark: "#1E293B", light: "#FFFFFF" },
        });

        // Draw label border
        doc.setDrawColor(200);
        doc.setFillColor(248, 250, 252);
        doc.roundedRect(x, y, labelW - 1, labelH - 1, 2, 2, "FD");

        // QR code image
        doc.addImage(qrDataUrl, "PNG", x + (labelW - qrSize) / 2, y + 2, qrSize, qrSize);

        // Carton code text
        doc.setFontSize(7);
        doc.setFont("helvetica", "bold");
        const codeText = carton.cartonCode.length > 20
          ? carton.cartonCode.slice(-16) : carton.cartonCode;
        doc.text(codeText, x + labelW / 2, y + qrSize + 7, { align: "center" });

        // Status badge text
        doc.setFontSize(6);
        doc.setFont("helvetica", "normal");
        doc.text(carton.status.replace("-", " ").toUpperCase(), x + labelW / 2, y + qrSize + 13, { align: "center" });

        // Move to next column
        x += labelW;
        if ((i + 1) % cols === 0) {
          x = margin;
          y += labelH;
          // New page if needed
          if (y > 280) {
            doc.addPage();
            y = 20;
          }
        }
      }

      doc.save(`Carton_QRs_${p._id.slice(-8)}.pdf`);
    } catch (err) {
      console.error("[QR PDF] Error:", err);
    } finally {
      setPdfGenerating(false);
    }
  }, [cartons, p.batchName, p._id]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-16 sm:pt-20 bg-black/70 backdrop-blur-sm overflow-y-auto"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full max-w-2xl bg-[#111614] rounded-3xl shadow-2xl border border-neutral-800/80 overflow-hidden relative" onClick={(e) => e.stopPropagation()}>
        <div className="absolute top-5 right-5 flex items-center gap-2 z-10">
          {cartons.length > 0 && (
            <button onClick={handleDownloadPDF} disabled={pdfGenerating}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#1a231d] text-[#84cc16] border border-[#84cc16]/40 rounded-full text-[11px] font-body font-semibold hover:bg-[#222e26] hover:border-[#84cc16]/60 hover:shadow-lg hover:shadow-[#84cc16]/10 active:scale-95 transition-all duration-200 disabled:opacity-50 whitespace-nowrap">
              {pdfGenerating ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
              QR Labels (PDF)
            </button>
          )}
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/10 border border-neutral-800 flex items-center justify-center text-neutral-400 hover:bg-white/20 hover:text-white transition-all"><X size={16} /></button>
        </div>
        <div className="p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-neutral-800/60 flex items-center justify-center"><Package size={24} className="text-[#84cc16]" /></div>
            <div>
              <h2 className="font-heading text-xl font-bold text-white">{p.batchName}</h2>
              <p className="text-sm text-neutral-400 font-body">Inbound Plan Details</p>
            </div>
          </div>

          {/* Info grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
            <div className="p-3 rounded-xl bg-neutral-900/80 border border-neutral-800">
              <p className="text-[10px] font-semibold tracking-wider text-neutral-400 uppercase mb-1 font-body">Total Cartons</p>
              <p className="text-lg font-bold text-white font-body numeric">{p.totalCartons}</p>
            </div>
            <div className="p-3 rounded-xl bg-neutral-900/80 border border-neutral-800">
              <p className="text-[10px] font-semibold tracking-wider text-neutral-400 uppercase mb-1 font-body">Expected</p>
              <p className="text-sm font-semibold text-white font-body">{formatDate(p.expectedDate)}</p>
            </div>
            <div className="p-3 rounded-xl bg-neutral-900/80 border border-neutral-800">
              <p className="text-[10px] font-semibold tracking-wider text-neutral-400 uppercase mb-1 font-body">Status</p>
              <p className="text-sm font-semibold text-white font-body capitalize">{p.status.replace("-", " ")}</p>
            </div>
            <div className="p-3 rounded-xl bg-neutral-900/80 border border-neutral-800">
              <p className="text-[10px] font-semibold tracking-wider text-neutral-400 uppercase mb-1 font-body">Created</p>
              <p className="text-sm font-semibold text-white font-body">{formatDate(p.createdAt)}</p>
            </div>
          </div>

          {/* Carton summary */}
          <div className="grid grid-cols-3 gap-3 mb-5">
            <div className="p-3 rounded-2xl bg-neutral-900/80 border border-neutral-800 text-center">
              <p className="text-lg font-bold text-white font-body numeric">{cartons.length}</p>
              <p className="text-[10px] text-neutral-400 font-body uppercase tracking-wider">Total</p>
            </div>
            <div className="p-3 rounded-2xl bg-neutral-900/80 border border-neutral-800 text-center">
              <div className="w-3 h-3 rounded-full bg-amber-400 mx-auto mb-1" />
              <p className="text-lg font-bold text-white font-body numeric">{inTransit}</p>
              <p className="text-[10px] text-neutral-400 font-body uppercase tracking-wider">In Transit</p>
            </div>
            <div className="p-3 rounded-2xl bg-neutral-900/80 border border-neutral-800 text-center">
              <div className="w-3 h-3 rounded-full bg-emerald-400 mx-auto mb-1" />
              <p className="text-lg font-bold text-white font-body numeric">{arrived}</p>
              <p className="text-[10px] text-neutral-400 font-body uppercase tracking-wider">Arrived</p>
            </div>
          </div>

          {/* Cartons list */}
          {cartons.length > 0 && (
            <div>
              <div className="hidden sm:grid grid-cols-[1fr_100px_110px] gap-3 px-4 py-2 bg-neutral-900/80 rounded-xl border border-neutral-800 mb-1">
                <span className="text-[10px] font-semibold tracking-wider text-neutral-400 uppercase font-body">Carton Code</span>
                <span className="text-[10px] font-semibold tracking-wider text-neutral-400 uppercase font-body">Status</span>
                <span className="text-[10px] font-semibold tracking-wider text-neutral-400 uppercase font-body">Shelf</span>
              </div>
              <div className="space-y-1 max-h-60 overflow-y-auto">
                {cartons.map((carton) => (
                  <div key={carton._id} className="grid grid-cols-[1fr_100px_110px] gap-3 items-center px-4 py-2.5 rounded-xl border border-neutral-800 bg-neutral-900/60 hover:bg-neutral-800/60 transition-colors">
                    <div className="flex items-center gap-2 min-w-0">
                      <Box size={13} className="text-[#84cc16] shrink-0" />
                      <span className="text-sm font-medium text-white font-body truncate">{carton.cartonCode}</span>
                    </div>
                    <div><span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${carton.status === "in-transit" ? "bg-amber-500/10 border-amber-500/20 text-amber-400" : carton.status === "arrived" ? "bg-sky-500/10 border-sky-500/20 text-sky-400" : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"}`}>{carton.status === "in-transit" ? "In Transit" : carton.status === "arrived" ? "Arrived" : "Stored"}</span></div>
                    <div className="text-xs text-neutral-400 font-body">{carton.shelf || "—"}</div>
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t border-neutral-800 text-xs text-neutral-500 font-body flex items-center justify-between">
                <span>{stored > 0 ? `${stored} stored` : arrived > 0 ? `${arrived} arrived` : "All in transit"}</span>
                <span>{cartons.length} of {p.totalCartons} cartons</span>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB: ACCOUNT / PROFILE
// ═══════════════════════════════════════════════════════════════════════════════

function AccountTab() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { accessToken } = useAppSelector((s) => s.auth);
  const { user, isLoading, isUpdating, error, successMessage } = useAppSelector((s) => s.profile);

  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const hasFetched = useRef(false);

  useEffect(() => {
    if (accessToken && !hasFetched.current) { hasFetched.current = true; dispatch(fetchProfile()); }
  }, [accessToken, dispatch]);

  useEffect(() => {
    if (user) { setPhone(user.phone || ""); setRole(user.role || ""); }
  }, [user]);

  useEffect(() => {
    if (successMessage) { setToast({ message: successMessage, type: "success" }); dispatch(clearProfileSuccess()); }
  }, [successMessage, dispatch]);

  useEffect(() => {
    if (error) { setToast({ message: error, type: "error" }); dispatch(clearProfileError()); }
  }, [error, dispatch]);

  const handleSubmit = useCallback(async () => {
    const payload: { phone?: string; role?: string } = {};
    if (phone !== (user?.phone || "")) payload.phone = phone;
    if (role !== (user?.role || "")) payload.role = role;
    if (Object.keys(payload).length === 0) { setToast({ message: "No changes to save.", type: "error" }); return; }
    try {
      const result = await dispatch(updateProfile(payload)).unwrap();
      if (result.user) {
        const u = result.user;
        dispatch(setUser({ id: u._id || u.id || null, email: u.email || null, role: u.role || null, name: u.name || null }));
      }
      // If role changed, redirect to appropriate dashboard
      if (payload.role && payload.role !== user?.role) {
        if (payload.role === "warehouseOwner") {
          router.push("/dashboard");
        } else if (payload.role === "worker") {
          router.push("/worker/scan");
        }
        // If merchant, stay on current page (already on merchant dashboard)
      }
    } catch { }
  }, [phone, role, user, dispatch, router]);

  const roleOptions = [
    { value: "merchant", label: "Merchant", icon: Store },
    { value: "warehouseOwner", label: "Warehouse Owner", icon: Warehouse },
    { value: "worker", label: "Worker", icon: HardHat },
  ];

  return (
    <div className="max-w-2xl mx-auto">
      {/* Toast */}
      <AnimatePresence>{toast && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
          className={`fixed top-28 right-6 z-[60] flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl border backdrop-blur-md ${toast.type === "success" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-300" : "bg-red-500/10 border-red-500/20 text-red-300"}`}>
          {toast.type === "success" ? <CheckCircle size={18} className="shrink-0 text-emerald-500" /> : <AlertCircle size={18} className="shrink-0 text-red-500" />}
          <span className="text-sm font-body font-medium">{toast.message}</span>
          <button onClick={() => setToast(null)} className="ml-2 p-1 rounded-full hover:bg-white/10 transition-colors"><XCircle size={14} className="opacity-50" /></button>
        </motion.div>
      )}</AnimatePresence>

      {isLoading && !user ? (
        <div className="bg-[#111614]/90 backdrop-blur-md rounded-3xl p-8 border border-neutral-800/80 animate-pulse space-y-6">
          <div className="h-8 bg-neutral-800/60 rounded-lg w-40" />
          <div className="flex items-center gap-5"><div className="w-16 h-16 rounded-2xl bg-neutral-800/60" /><div className="space-y-2"><div className="h-5 bg-neutral-800/60 rounded w-48" /><div className="h-4 bg-neutral-800/60 rounded w-64" /></div></div>
          <div className="h-12 bg-neutral-800/60 rounded-xl w-full" />
        </div>
      ) : (
        <div className="bg-[#111614]/90 backdrop-blur-md rounded-3xl p-6 md:p-8 border border-neutral-800/80 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-neutral-800/60 flex items-center justify-center"><User size={20} className="text-[#84cc16]" /></div>
            <h2 className="font-heading text-xl font-bold text-white">My Profile</h2>
          </div>

          {user && (
            <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 mb-6">
              <div className="w-14 h-14 rounded-2xl bg-[#84cc16]/10 flex items-center justify-center shrink-0">
                <User size={28} className="text-[#84cc16]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h3 className="font-heading text-lg font-semibold text-white truncate">{user.name}</h3>
                  {user.isVerified && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-body font-medium"><CheckCircle size={11} /> Verified</span>}
                </div>
                <div className="flex items-center gap-1.5 mt-1 text-sm text-neutral-400 font-body"><Mail size={14} /><span className="truncate">{user.email}</span></div>
              </div>
            </div>
          )}

          {user && (
            <div className="flex items-center justify-between bg-neutral-900/80 border border-neutral-800 rounded-xl p-3 mb-6">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-[10px] text-neutral-500 uppercase font-semibold tracking-wider font-body">USER ID:</span>
                <code className="text-xs font-mono text-neutral-300 font-medium break-all">{user._id || user.id || "—"}</code>
              </div>
              <CopyButton value={user._id || user.id || ""} />
            </div>
          )}

          <div className="space-y-5">
            <div>
              <label className="text-xs font-semibold tracking-wider text-white uppercase mb-1.5 block font-body">Phone Number</label>
              <div className="relative">
                <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#84cc16]/60 pointer-events-none" />
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 (555) 000-0000"
                  className="w-full pl-11 pr-4 py-3.5 bg-neutral-900/80 border border-neutral-800 rounded-xl text-white placeholder:text-neutral-500 focus:outline-none focus:border-[#84cc16] focus:bg-neutral-900 transition-all text-sm font-body" />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold tracking-wider text-white uppercase mb-3 block font-body">Account Role</label>
              <div className="grid grid-cols-3 gap-2.5">
                {roleOptions.map((opt) => {
                  const isActive = role === opt.value;
                  return (
                    <button key={opt.value} type="button" onClick={() => setRole(opt.value)}
                      className={`flex flex-col items-center justify-center gap-1.5 p-4 min-h-[80px] rounded-xl border-2 text-sm font-body font-medium transition-all duration-200 ${                      isActive
                        ? "bg-[#1a231d] text-[#84cc16] border-2 border-[#84cc16] shadow-lg shadow-[#84cc16]/10" : "bg-transparent text-neutral-400 border-neutral-800 hover:border-[#84cc16]/40 hover:bg-white/5"}`}>
                      <opt.icon size={20} /><span className="text-[11px] leading-tight text-center">{opt.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <button onClick={handleSubmit} disabled={isUpdating}
              className="w-full inline-flex items-center justify-center gap-2.5 px-6 py-3.5 bg-[#1a231d] text-[#84cc16] border border-[#84cc16]/40 rounded-full font-body font-semibold text-sm hover:bg-[#222e26] hover:border-[#84cc16]/60 hover:shadow-lg hover:shadow-[#84cc16]/10 active:scale-95 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed">
              {isUpdating ? <><Loader2 size={18} className="animate-spin" />Updating...</> : <><Save size={18} />Save Changes</>}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PAGE: MERCHANT DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════════

export default function MerchantDashboardPage() {
  const { accessToken, user, isCheckingAuth } = useAppSelector((s) => s.auth);
  const { unread } = useAppSelector((s) => s.notifications);
  const router = useRouter();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>("overview");

  // ─── Auth guard ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (isCheckingAuth) return;
    if (!accessToken) router.replace("/login");
  }, [accessToken, isCheckingAuth, router]);

  if (isCheckingAuth) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#0a0d0c]">
        <Loader2 size={32} className="animate-spin text-[#84cc16]" />
      </div>
    );
  }

  const renderTab = () => {
    switch (activeTab) {
      case "overview": return <OverviewTab />;
      case "explore": return <ExploreTab />;
      case "my-bookings": return <MyBookingsTab onTabChange={setActiveTab} />;
      case "inbounds": return <InboundsTab onTabChange={setActiveTab} />;
      case "account": return <AccountTab />;
      default: return <OverviewTab />;
    }
  };

  const tabTitles: Record<TabId, string> = {
    overview: "Dashboard Overview",
    explore: "Explore Warehouses",
    "my-bookings": "My Bookings",
    inbounds: "Inbounds & Cartons",
    account: "Account / Profile",
  };

  const tabDescriptions: Record<TabId, string> = {
    overview: "Your business at a glance",
    explore: "Discover and book warehouse space",
    "my-bookings": "Manage your shelf bookings",
    inbounds: "Track incoming inventory shipments",
    account: "Manage your account settings",
  };

  return (
    <div className="relative overflow-hidden min-h-screen bg-[#0a0d0c]">
      {/* Ambient smoky radial glows */}
      <div className="pointer-events-none fixed top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-[#84cc16]/10 blur-[130px] z-0" />
      <div className="pointer-events-none fixed bottom-[5%] right-[-5%] w-[450px] h-[450px] rounded-full bg-emerald-500/10 blur-[150px] z-0" />
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <TopHeader onMenuToggle={() => setSidebarOpen(true)} unread={unread} />

      <main className="pt-16 md:pl-60">
        <div className="px-4 sm:px-6 md:px-8 py-6 max-w-7xl mx-auto relative z-10">
          {/* Page header */}
          <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
            className="mb-6">
            <h1 className="font-heading text-2xl sm:text-3xl font-bold text-white tracking-tight">{tabTitles[activeTab]}</h1>
            <p className="mt-1 text-sm text-neutral-400 font-body">{tabDescriptions[activeTab]}</p>
          </motion.div>

          {/* Tab content */}
          <motion.div key={activeTab + "-content"} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }}>
            {renderTab()}
          </motion.div>
        </div>
      </main>
    </div>
  );
}
