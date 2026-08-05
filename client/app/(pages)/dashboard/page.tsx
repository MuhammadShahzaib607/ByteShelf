"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Warehouse, Plus, User, ShieldCheck, LogOut,
  Menu, ArrowLeft, Loader2, Bell, Building2, Layers, TrendingUp,
  CalendarDays, MapPin, Eye, Edit3, ChevronRight, DollarSign,
  Package, Clock, CheckCircle, XCircle, CreditCard, Mail,
  Save, Check, Image as ImageIcon, Video,
  ThumbsUp, ThumbsDown, X, Search, Undo2, AlertCircle,
  Phone, HardHat, Store, Copy, ChevronLeft,
  Truck, ClipboardList, Box,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { logout, setUser } from "@/redux/slices/authSlice";
import { fetchNotifications } from "@/redux/slices/notificationSlice";
import { fetchProfile, updateProfile, clearProfileError, clearProfileSuccess } from "@/redux/slices/profileSlice";
import api from "@/lib/axios";
import { uploadToCloudinary } from "@/lib/cloudinary";
import Input from "@/components/ui/Input";
import MapPicker from "@/components/ui/MapPicker";
import ImageCarousel from "@/components/ui/ImageCarousel";
import ConfirmationModal from "@/components/ui/ConfirmationModal";
import EditWarehouseModal from "@/components/ui/EditWarehouseModal";
import ManageShelvesModal from "@/components/ui/ManageShelvesModal";
import DispatchOrderModal from "@/components/ui/DispatchOrderModal";
import DeliveryConfirmationModal from "@/components/ui/DeliveryConfirmationModal";

// ─── Types ──────────────────────────────────────────────────────────────────────

type TabId = "overview" | "warehouses" | "add-warehouse" | "orders" | "profile" | "verifications";

interface WarehouseData { _id: string; name: string; location: string; pricePerShelf: number; totalShelves: number; images: string[]; createdAt: string; }
interface BookingData { _id: string; merchant: { _id: string; name: string; email: string; phone: string }; warehouse: { _id: string; name: string; location: string }; shelves: Array<{ _id: string; shelfNumber: string }>; startDate: string; endDate: string; status: string; paymentStatus: string; totalAmount: number; createdAt: string; }
interface WarehouseDetail { warehouse: { _id: string; name: string; location: string; latitude: number; longitude: number; pricePerShelf: number; totalShelves: number; images: string[]; createdAt: string; owner?: string; }; available: number; booked: number; }
interface ShelfData { _id: string; shelfNumber: number; pricePerMonth: number; status: "available" | "booked"; }
interface WarehouseBooking { _id: string; merchant: { _id: string; name: string; phone: string; email: string }; shelves: Array<{ _id: string; shelfNumber: string }>; startDate: string; endDate: string; status: "confirmed" | "cancelled" | "completed"; paymentStatus: "pending" | "paid"; totalAmount: number; pricePerShelf: number; createdAt: string; }
type FilterStatus = "all" | "pending" | "approved" | "rejected";
interface KycUser { _id: string; name: string; email: string; role: string; verificationStatus: string; isVerified: boolean; kycDocuments?: { nicFront: string; nicBack: string; livePhoto: string; liveVideo: string; }; createdAt: string; rejectionReason?: string; }

// ─── Role options ────────────────────────────────────────────────────────────────

const roleOptions = [
  { value: "merchant", label: "Merchant", icon: Store },
  { value: "warehouseOwner", label: "Warehouse Owner", icon: Warehouse },
  { value: "worker", label: "Worker", icon: HardHat },
];

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
    paid: { bg: "bg-emerald-500/10 border-emerald-500/20", text: "text-emerald-400", icon: <CreditCard size={11} />, label: "Paid" },
    pending: { bg: "bg-amber-500/10 border-amber-500/20", text: "text-amber-400", icon: <Clock size={11} />, label: "Pending" },
  };
  const s = c[status] || c.pending;
  return <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider border ${s.bg} ${s.text}`}>{s.icon}{s.label}</span>;
}

// ═══════════════════════════════════════════════════════════════════════════════
// COPY BUTTON Component
// ═══════════════════════════════════════════════════════════════════════════════

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = value;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };
  return (
    <button onClick={handleCopy} title="Copy User ID"
      className={`p-1.5 rounded-lg border transition-all duration-200 shrink-0 ${
        copied ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-neutral-900/80 border-neutral-800 text-neutral-500 hover:text-white hover:bg-neutral-800/60 hover:border-neutral-700"
      }`}>
      {copied ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
    </button>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// IMAGE PREVIEW (for AddWarehouseTab)
// ═══════════════════════════════════════════════════════════════════════════════

function ImagePreview({ src, onRemove, isUploading }: { src: string; onRemove: () => void; isUploading?: boolean }) {
  return (
    <div className="relative group w-24 h-24 md:w-28 md:h-28 rounded-xl overflow-hidden bg-white/5 shrink-0">
      <img src={src} alt="" className="absolute inset-0 w-full h-full object-cover blur-2xl opacity-60 scale-110" />
      <img src={src} alt="Preview" className="relative z-10 w-full h-full object-contain drop-shadow-2xl" />
      {isUploading && <div className="absolute inset-0 bg-black/30 flex items-center justify-center"><Loader2 size={18} className="animate-spin text-white" /></div>}
      <button type="button" onClick={onRemove}
        className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100">
        <X size={10} className="text-white" />
      </button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SIDEBAR
// ═══════════════════════════════════════════════════════════════════════════════

const SIDEBAR_TABS: { id: TabId; label: string; icon: React.ElementType; adminOnly?: boolean }[] = [
  { id: "overview", label: "Dashboard", icon: LayoutDashboard },
  { id: "warehouses", label: "My Warehouses", icon: Warehouse },
  { id: "add-warehouse", label: "Add Warehouse", icon: Plus },
  { id: "orders", label: "Orders & Dispatch", icon: Truck },
  { id: "profile", label: "Account / Profile", icon: User },
  { id: "verifications", label: "Verify Users", icon: ShieldCheck, adminOnly: true },
];

function Sidebar({ activeTab, onTabChange, isOpen, onClose, isAdmin }: {
  activeTab: TabId; onTabChange: (id: TabId) => void;
  isOpen: boolean; onClose: () => void; isAdmin: boolean;
}) {
  const { user } = useAppSelector((s) => s.auth);
  const { unread } = useAppSelector((s) => s.notifications);
  const dispatch = useAppDispatch();
  const handleLogout = () => { dispatch(logout()); localStorage.removeItem("byteshelf_access_token"); localStorage.removeItem("auth_tokens"); window.location.href = "/login"; };

  const content = (
    <div className="flex flex-col h-full bg-neutral-900/95 backdrop-blur-md">
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
        {SIDEBAR_TABS.filter((t) => !t.adminOnly || isAdmin).map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button key={tab.id} onClick={() => { onTabChange(tab.id); onClose(); }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-body text-left transition-all duration-200 ${
                isActive ? "bg-neutral-800 text-[#84cc16] border-l-2 border-[#84cc16] font-medium" : "text-neutral-400 hover:text-white hover:bg-white/5"
              }`}>
              <Icon className={isActive ? "text-[#84cc16] w-5 h-5" : "text-neutral-400 w-5 h-5"} />{tab.label}
            </button>
          );
        })}
      </nav>

      {/* Action items — Notifications (mobile & desktop drawer) */}
      <div className="shrink-0 px-3 pb-3 border-t border-white/10">
        <Link
          href="/notifications"
          onClick={onClose}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-body text-neutral-400 hover:text-white hover:bg-white/5 transition-all duration-200"
        >
          <span className="relative">
            <Bell size={18} className="text-neutral-400" />
            {unread > 0 && (
              <span className="absolute -top-1.5 -right-1.5 flex items-center justify-center min-w-[16px] h-[16px] px-1 rounded-full bg-red-500 text-[8px] font-bold text-white font-body">
                {unread > 99 ? "99+" : unread}
              </span>
            )}
          </span>
          Notifications
        </Link>
      </div>
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
    <aside className="hidden md:flex flex-col fixed left-0 top-0 bottom-0 w-60 bg-neutral-900/95 backdrop-blur-md border-r border-white/10 z-40">{content}</aside>
    <AnimatePresence>{isOpen && (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 md:hidden" onClick={onClose}>
        <motion.aside initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }} transition={{ type: "spring", stiffness: 300, damping: 30 }} className="fixed left-0 top-0 bottom-0 w-60 bg-neutral-900/95 backdrop-blur-md z-50" onClick={(e) => e.stopPropagation()}>{content}</motion.aside>
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
          <h1 className="text-sm font-semibold text-white font-body hidden sm:block">Welcome back, {user?.name?.split(" ")[0] || "User"}</h1>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/notifications" className="relative flex items-center justify-center w-9 h-9 rounded-full bg-white/10 border border-white/10 hover:bg-white/20 transition-colors">
            <Bell size={17} className="text-neutral-300" />
            {unread > 0 && <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 border-2 border-[#0a0d0c] text-[9px] font-bold text-white font-body shadow-sm">{unread > 99 ? "99+" : unread}</span>}
          </Link>
          {/* Avatar opens the drawer on mobile — profile access in one tap */}
          <button type="button" onClick={onMenuToggle} aria-label="Open menu"
            className="md:hidden flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/10 hover:bg-white/20 transition-all">
            <div className="w-7 h-7 rounded-full bg-[#84cc16] flex items-center justify-center">
              <span className="text-[11px] font-semibold text-black font-body">{user?.name?.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2) || "U"}</span>
            </div>
          </button>
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/10">
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
  const [warehouses, setWarehouses] = useState<WarehouseData[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<BookingData | null>(null);
  const [totalWh, setTotalWh] = useState(0);
  const [totalSh, setTotalSh] = useState(0);
  const [whLoading, setWhLoading] = useState(true);
  const [bookings, setBookings] = useState<BookingData[]>([]);
  const [activeBk, setActiveBk] = useState(0);
  const [totalRev, setTotalRev] = useState(0);
  const [bkLoading, setBkLoading] = useState(true);

  useEffect(() => { if (!accessToken) return; let c = false; (async () => { try { const r = await api.get("/warehouse/my-warehouses"); const d = r.data.data; if (!c) { setWarehouses(d.warehouses || []); setTotalWh(d.totalWarehouses || 0); setTotalSh(d.totalShelves || 0); } } catch {} finally { if (!c) setWhLoading(false); } })(); return () => { c = true; }; }, [accessToken]);
  useEffect(() => { if (!accessToken) return; let c = false; (async () => { try { const r = await api.get("/booking/owner-bookings"); const d = r.data.data; if (!c) { setBookings(d.bookings || []); setActiveBk(d.activeBookings || 0); setTotalRev(d.totalRevenue || 0); } } catch {} finally { if (!c) setBkLoading(false); } })(); return () => { c = true; }; }, [accessToken]);

  const handleBookingUpdated = useCallback((updatedBooking: BookingData) => {
    setSelectedBooking(updatedBooking);
    setBookings((prev) => {
      const updated = prev.map((b) => b._id === updatedBooking._id ? updatedBooking : b);
      const newActiveBk = updated.filter((b) => b.status === "confirmed").length;
      const newTotalRev = updated.filter((b) => b.status === "confirmed").reduce((sum, b) => sum + (b.totalAmount || 0), 0);
      setActiveBk(newActiveBk);
      setTotalRev(newTotalRev);
      return updated;
    });
  }, []);

  const isLoading = whLoading || bkLoading;
  const occShelves = bookings.filter((b) => b.status === "confirmed").reduce((s, b) => s + (b.shelves?.length || 0), 0);
  const occRate = totalSh > 0 ? Math.round((occShelves / totalSh) * 100) : 0;

  return (
    <div>
      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[...Array(4)].map((_, i) => <div key={i} className="bg-[#111614] rounded-2xl p-5 border border-neutral-800/80 animate-pulse"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-neutral-800/60" /><div className="space-y-2 flex-1"><div className="h-6 bg-neutral-800/60 rounded w-16" /><div className="h-3 bg-neutral-800/60 rounded w-24" /></div></div></div>)}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { icon: Building2, label: "Total Warehouses", value: totalWh, delay: 0.05 },
            { icon: Layers, label: "Total Shelves", value: totalSh, sub: `${occShelves} occupied · ${totalSh - occShelves} free`, delay: 0.1 },
            { icon: Package, label: "Active Bookings", value: activeBk, sub: `${occRate}% occupancy rate`, delay: 0.15 },
            { icon: DollarSign, label: "Est. Monthly Revenue", value: `Rs. ${totalRev.toLocaleString("en-PK")}`, sub: "From active bookings", delay: 0.2 },
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
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.25 }}>
        <div className="flex items-center justify-between mb-5">
          <div><h2 className="font-heading text-xl font-semibold text-white">Recent Activity</h2><p className="text-sm text-neutral-400 font-body mt-0.5">Latest bookings across your properties</p></div>
        </div>
        {bkLoading ? (
          <div className="bg-[#111614]/90 backdrop-blur-md rounded-3xl border border-neutral-800/80 shadow-sm p-8 animate-pulse space-y-4">{[...Array(5)].map((_, i) => <div key={i} className="h-10 bg-neutral-800/60 rounded-xl" />)}</div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-16 bg-[#111614]/90 backdrop-blur-md rounded-3xl border border-neutral-800/80 shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-neutral-800/60 flex items-center justify-center mx-auto mb-4"><CalendarDays size={28} className="text-[#84cc16]/40" /></div>
            <h3 className="font-heading text-lg font-semibold text-white mb-2">No bookings yet</h3>
            <p className="text-sm text-neutral-400 font-body max-w-sm mx-auto">When merchants book your shelves, their activity will appear here.</p>
          </div>
        ) : (
          <div className="bg-[#111614]/90 backdrop-blur-md rounded-3xl border border-neutral-800/80 shadow-sm overflow-hidden">
            <div className="hidden lg:grid grid-cols-[1fr_1fr_120px_130px_140px] gap-3 px-6 py-3.5 bg-neutral-900/80 border-b border-neutral-800">
              <span className="text-[10px] font-semibold tracking-wider text-neutral-400 uppercase font-body">Merchant</span>
              <span className="text-[10px] font-semibold tracking-wider text-neutral-400 uppercase font-body">Warehouse</span>
              <span className="text-[10px] font-semibold tracking-wider text-neutral-400 uppercase font-body">Shelves</span>
              <span className="text-[10px] font-semibold tracking-wider text-neutral-400 uppercase font-body">Status</span>
              <span className="text-[10px] font-semibold tracking-wider text-neutral-400 uppercase font-body text-right">Amount</span>
            </div>
            <div className="divide-y divide-neutral-800/80">
              {bookings.slice(0, 10).map((b, i) => (
                <motion.div key={b._id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: i * 0.03 }}
                  className="grid grid-cols-1 lg:grid-cols-[1fr_1fr_120px_130px_140px] gap-2 lg:gap-3 items-center px-6 py-4 hover:bg-white/5 transition-colors duration-200 cursor-pointer"
                  onClick={() => setSelectedBooking(b)}>
                  <div className="lg:hidden space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0"><div className="w-7 h-7 rounded-full bg-[#84cc16] flex items-center justify-center shrink-0"><span className="text-[10px] font-semibold text-black font-body">{b.merchant?.name?.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2) || "M"}</span></div><span className="text-sm font-medium text-white font-body truncate">{b.merchant?.name || "Unknown"}</span></div>
                      {statusBadge(b.status)}
                    </div>
                    <div className="flex items-center justify-between text-xs text-neutral-400 font-body"><span className="truncate">{b.warehouse?.name || "Warehouse"}</span><span className="font-semibold text-white numeric">Rs. {(b.totalAmount || 0).toLocaleString("en-PK")}</span></div>
                    <div className="flex items-center gap-3 text-[11px] text-neutral-500 font-body"><span>{b.shelves?.length || 0} shelf(ves)</span><span>·</span><span>{formatDate(b.createdAt)}</span></div>
                  </div>
                  <div className="hidden lg:flex items-center gap-2.5 min-w-0"><div className="w-7 h-7 rounded-full bg-[#84cc16] flex items-center justify-center shrink-0"><span className="text-[10px] font-semibold text-black font-body">{b.merchant?.name?.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2) || "M"}</span></div><span className="text-sm font-medium text-white font-body truncate">{b.merchant?.name || "Unknown"}</span><span className="text-[11px] text-neutral-500 font-body hidden xl:inline">{b.merchant?.email || ""}</span></div>
                  <div className="hidden lg:block text-sm text-neutral-300 font-body truncate">{b.warehouse?.name || "—"}</div>
                  <div className="hidden lg:flex items-center gap-1.5 text-sm text-neutral-400 font-body"><Layers size={13} className="text-[#84cc16]/60" /><span>{b.shelves?.length || 0}</span></div>
                  <div className="hidden lg:block">{statusBadge(b.status)}</div>
                  <div className="hidden lg:block text-sm font-semibold text-white font-body numeric text-right">Rs. {(b.totalAmount || 0).toLocaleString("en-PK")}</div>
                </motion.div>
              ))}
            </div>
            {bookings.length > 10 && <div className="px-6 py-3.5 border-t border-neutral-800 text-center"><Link href="/warehouses" className="text-sm text-[#84cc16] font-medium font-body hover:text-[#84cc16] transition-colors">View all {bookings.length} bookings</Link></div>}
          </div>
        )}
      </motion.div>

      {/* ═══ Booking Details Modal ═══ */}
      <AnimatePresence>
        {selectedBooking && (
          <BookingDetailsModal
            booking={selectedBooking}
            onClose={() => setSelectedBooking(null)}
            onBookingUpdated={handleBookingUpdated}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// BOOKING DETAILS MODAL
// ═══════════════════════════════════════════════════════════════════════════════

function BookingDetailsModal({ booking, onClose, onBookingUpdated }: { booking: BookingData; onClose: () => void; onBookingUpdated?: (updated: BookingData) => void }) {
  const { accessToken } = useAppSelector((s) => s.auth);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showPaidConfirm, setShowPaidConfirm] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  const handleConfirmPaid = useCallback(async () => {
    if (!booking.warehouse?._id) return;
    setActionLoading("paid");
    setActionError(null);
    setShowPaidConfirm(false);
    try {
      await api.patch(`/booking/warehouse/${booking.warehouse._id}/mark-paid/${booking._id}`);
      const updated = { ...booking, paymentStatus: "paid" };
      onBookingUpdated?.(updated);
      setToast({ message: "Payment marked as PAID successfully", type: "success" });
    } catch {
      setActionError("Failed to mark as paid");
    } finally {
      setActionLoading(null);
    }
  }, [booking, onBookingUpdated]);

  const handleCancelBooking = useCallback(async (reason?: string) => {
    if (!booking.warehouse?._id) return;
    setActionLoading("cancel");
    setActionError(null);
    setShowCancelConfirm(false);
    try {
      await api.patch(`/booking/warehouse/${booking.warehouse._id}/cancel/${booking._id}`, { reason: reason || "" });
      const updated = { ...booking, status: "cancelled" };
      onBookingUpdated?.(updated);
      setToast({ message: "Booking cancelled successfully", type: "success" });
    } catch {
      setActionError("Failed to cancel booking");
    } finally {
      setActionLoading(null);
    }
  }, [booking._id, booking.warehouse?._id]);

  const b = booking;
  const shelfCount = b.shelves?.length || 0;
  const start = new Date(b.startDate);
  const end = new Date(b.endDate);
  const months = calcMonths(start, end);
  const isActive = b.status === "confirmed";
  const canMarkPaid = isActive && b.paymentStatus === "pending";
  const canCancel = b.status !== "cancelled" && b.status !== "completed";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-16 sm:pt-20 bg-black/70 backdrop-blur-sm overflow-y-auto"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="w-full max-w-2xl bg-[#111614] rounded-3xl shadow-2xl border border-neutral-800/80 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/10 border border-neutral-800 flex items-center justify-center text-neutral-400 hover:bg-white/20 hover:text-white transition-all duration-200 z-10">
          <X size={16} />
        </button>

        {/* Toast */}
        <AnimatePresence>
          {toast && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              className={`absolute top-5 left-1/2 -translate-x-1/2 z-20 px-5 py-3 rounded-2xl border shadow-lg flex items-center gap-2.5 ${
                toast.type === "success" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-300" : "bg-red-500/10 border-red-500/20 text-red-300"
              }`}>
              {toast.type === "success" ? <CheckCircle size={16} className="shrink-0" /> : <AlertCircle size={16} className="shrink-0" />}
              <span className="text-xs font-body font-semibold">{toast.message}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="p-6 sm:p-8">
          {/* ═══ HEADER: Merchant + Status ═══ */}
          <div className="flex items-start justify-between gap-4 mb-6">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-11 h-11 rounded-2xl bg-[#84cc16] flex items-center justify-center shrink-0">
                <span className="text-sm font-bold text-black font-body">
                  {b.merchant?.name?.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2) || "M"}
                </span>
              </div>
              <div className="min-w-0">
                <h2 className="font-heading text-lg font-semibold text-white truncate">{b.merchant?.name || "Unknown Merchant"}</h2>
                <div className="flex items-center gap-2 text-xs text-neutral-400 font-body mt-0.5">
                  <Mail size={12} className="shrink-0" />
                  <span className="truncate">{b.merchant?.email || "—"}</span>
                  {b.merchant?.phone && <><span className="text-neutral-700">·</span><Phone size={12} className="shrink-0" /><span>{b.merchant.phone}</span></>}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              {statusBadge(b.status)}
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider border ${
                b.paymentStatus === "paid" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-amber-500/10 border-amber-500/20 text-amber-400"
              }`}>
                {b.paymentStatus === "paid" ? <CheckCircle size={11} /> : <Clock size={11} />}
                {b.paymentStatus === "paid" ? "Paid" : "Pending"}
              </span>
            </div>
          </div>

          {/* ═══ DETAILS: Date Grid + Price ═══ */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
            <div className="p-3 rounded-xl bg-neutral-900/80 border border-neutral-800">
              <p className="text-[10px] font-semibold tracking-wider text-neutral-400 uppercase mb-1 font-body">Start Date</p>
              <p className="text-sm font-semibold text-white font-body">{formatDate(b.startDate)}</p>
            </div>
            <div className="p-3 rounded-xl bg-neutral-900/80 border border-neutral-800">
              <p className="text-[10px] font-semibold tracking-wider text-neutral-400 uppercase mb-1 font-body">End Date</p>
              <p className="text-sm font-semibold text-white font-body">{formatDate(b.endDate)}</p>
            </div>
            <div className="p-3 rounded-xl bg-neutral-900/80 border border-neutral-800">
              <p className="text-[10px] font-semibold tracking-wider text-neutral-400 uppercase mb-1 font-body">Duration</p>
              <p className="text-sm font-semibold text-white font-body">{months} {months === 1 ? "month" : "months"}</p>
            </div>
            <div className="p-3 rounded-xl bg-neutral-900/80 border border-neutral-800">
              <p className="text-[10px] font-semibold tracking-wider text-neutral-400 uppercase mb-1 font-body">Shelves</p>
              <p className="text-sm font-semibold text-white font-body">{shelfCount}</p>
            </div>
          </div>

          {/* ═══ WAREHOUSE ═══ */}
          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-white/5 border border-white/10 mb-5">
            <div className="w-9 h-9 rounded-lg bg-neutral-900/80 border border-neutral-800 flex items-center justify-center shrink-0">
              <Warehouse size={16} className="text-[#84cc16]" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-white font-body truncate">{b.warehouse?.name || "—"}</p>
              <div className="flex items-center gap-1 text-[11px] text-neutral-400 font-body">
                <MapPin size={11} />
                <span className="truncate">{b.warehouse?.location || "—"}</span>
              </div>
            </div>
          </div>

          {/* ═══ BOOKED SHELVES ═══ */}
          {b.shelves && b.shelves.length > 0 && (
            <div className="mb-5">
              <p className="text-[10px] font-semibold tracking-wider text-neutral-400 uppercase mb-2 font-body">Booked Shelves</p>
              <div className="flex flex-wrap gap-2">
                {b.shelves.map((shelf) => (
                  <span key={shelf._id}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-neutral-800 text-xs font-body">
                    <Layers size={12} className="text-[#84cc16]" />
                    <span className="font-medium text-white">{shelf.shelfNumber}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* ═══ FINANCIAL SUMMARY ═══ */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-neutral-800/80 to-neutral-900/80 border border-neutral-800 mb-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard size={16} className="text-[#84cc16]" />
                <span className="text-sm font-medium text-white font-body">Total Amount</span>
              </div>
              <span className="font-heading text-xl font-bold text-white numeric">
                Rs. {(b.totalAmount || 0).toLocaleString("en-PK")}
              </span>
            </div>
            <div className="mt-3 flex items-center justify-between text-[11px] text-neutral-400 font-body pt-3 border-t border-neutral-800">
              <span>{shelfCount} shelf{ shelfCount !== 1 ? "s" : "" } × {months} {months === 1 ? "month" : "months"}</span>
              <span className="font-medium text-white numeric">Rs. {(shelfCount > 0 ? Math.round(b.totalAmount / shelfCount / months) : 0).toLocaleString("en-PK")}/shelf/mo</span>
            </div>
          </div>

          {/* ═══ ACTION BUTTONS ═══ */}
          {actionError && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-2.5">
              <AlertCircle size={14} className="text-red-400 shrink-0 mt-0.5" />
              <p className="text-xs text-red-400 font-body">{actionError}</p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            {canMarkPaid && (
              <button onClick={() => setShowPaidConfirm(true)} disabled={actionLoading === "paid"}
                className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 bg-[#1a231d] text-[#84cc16] border border-[#84cc16]/40 rounded-full font-body text-sm font-semibold hover:bg-[#222e26] hover:border-[#84cc16]/60 hover:shadow-lg hover:shadow-[#84cc16]/10 active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm">
                {actionLoading === "paid" ? <Loader2 size={16} className="animate-spin" /> : <CreditCard size={16} />}
                Mark as Paid
              </button>
            )}
            {canCancel && (
              <button onClick={() => setShowCancelConfirm(true)} disabled={actionLoading === "cancel"}
                className={`inline-flex items-center justify-center gap-2 px-5 py-3 border-2 border-red-500/30 text-red-400 rounded-full font-body text-sm font-medium hover:bg-red-500/10 active:scale-95 transition-all duration-200 disabled:opacity-50 ${canMarkPaid ? "" : "flex-1"}`}>
                {actionLoading === "cancel" ? <Loader2 size={16} className="animate-spin" /> : <XCircle size={16} />}
                Cancel Booking
              </button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Cancel Confirmation */}
      <AnimatePresence>
        {showCancelConfirm && (
          <ConfirmationModal
            title="Cancel Booking?"
            message="Are you sure you want to cancel this booking? The merchant will be notified and the shelves will become available again."
            confirmLabel="Yes, Cancel Booking"
            cancelLabel="No, Keep Booking"
            variant="danger"
            showReasonInput
            reasonPlaceholder="Reason for cancellation (Optional)"
            onConfirm={handleCancelBooking}
            onCancel={() => setShowCancelConfirm(false)}
            isLoading={actionLoading === "cancel"}
          />
        )}

        {/* Paid Confirmation */}
        {showPaidConfirm && (
          <ConfirmationModal
            title="Confirm Payment"
            message={`Are you sure you want to mark this booking (Rs. ${(b.totalAmount || 0).toLocaleString("en-PK")}) as PAID?`}
            confirmLabel="Confirm Payment"
            cancelLabel="Cancel"
            variant="warning"
            onConfirm={handleConfirmPaid}
            onCancel={() => setShowPaidConfirm(false)}
            isLoading={actionLoading === "paid"}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB: MY WAREHOUSES — Inline list + detail view
// ═══════════════════════════════════════════════════════════════════════════════

// ─── Warehouse Detail Inline View ──────────────────────────────────────────────

function WarehouseDetailView({ warehouseId, onBack }: { warehouseId: string; onBack: () => void }) {
  const { accessToken, user } = useAppSelector((s) => s.auth);
  const [detail, setDetail] = useState<WarehouseDetail | null>(null);
  const [shelves, setShelves] = useState<ShelfData[]>([]);
  const [loading, setLoading] = useState(true);
  const [shelvesLoading, setShelvesLoading] = useState(true);
  const [shelfFilter, setShelfFilter] = useState<"all" | "available" | "booked">("all");

  const w = detail?.warehouse;
  const isOwnWarehouse = user?.id && w?.owner && user.id === w.owner;

  useEffect(() => {
    if (!accessToken) return;
    let c = false;
    (async () => {
      try { const r = await api.get(`/warehouse/${warehouseId}`); if (!c) setDetail(r.data.data); } catch {} finally { if (!c) setLoading(false); }
    })();
    return () => { c = true; };
  }, [accessToken, warehouseId]);

  useEffect(() => {
    if (!accessToken || !warehouseId) return;
    let c = false;
    (async () => {
      try {
        const ep = isOwnWarehouse ? `/shelf/${warehouseId}` : `/shelf/warehouse/${warehouseId}/available`;
        const r = await api.get(ep);
        if (!c) setShelves(r.data.data?.shelves || r.data.data || []);
      } catch {} finally { if (!c) setShelvesLoading(false); }
    })();
    return () => { c = true; };
  }, [accessToken, warehouseId, isOwnWarehouse]);

  if (loading) return (
    <div className="max-w-6xl mx-auto animate-pulse space-y-6">
      <div className="h-5 bg-neutral-800/60 rounded w-32" />
      <div className="h-64 bg-neutral-800/60 rounded-3xl" />
      <div className="grid grid-cols-3 gap-4"><div className="h-24 bg-neutral-800/60 rounded-2xl" /><div className="h-24 bg-neutral-800/60 rounded-2xl" /><div className="h-24 bg-neutral-800/60 rounded-2xl" /></div>
    </div>
  );

  if (!w) return (
    <div className="text-center py-16">
      <AlertCircle size={32} className="mx-auto text-[#84cc16]/40 mb-3" />
      <h3 className="font-heading text-lg font-semibold text-white mb-2">Warehouse not found</h3>
      <button onClick={onBack} className="mt-2 px-5 py-2.5 bg-[#1a231d] text-[#84cc16] border border-[#84cc16]/40 rounded-full text-sm font-body font-semibold hover:bg-[#222e26] hover:border-[#84cc16]/60 hover:shadow-lg hover:shadow-[#84cc16]/10 transition-all">← Back to My Warehouses</button>
    </div>
  );

  const filteredShelves = shelves.filter((s) => {
    if (shelfFilter === "all") return true;
    return s.status === shelfFilter;
  });

  return (
    <div className="max-w-6xl mx-auto">
      {/* Back button */}
      <button onClick={onBack} className="inline-flex items-center gap-1.5 text-sm text-neutral-400 hover:text-white font-body transition-colors mb-6">
        <ChevronLeft size={16} /> Back to My Warehouses
      </button>

      {/* Compact 2-Column Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-5 mb-6">
        {/* Left: Image + Title */}
        <div className="bg-[#111614]/90 backdrop-blur-md rounded-2xl overflow-hidden border border-neutral-800/80 shadow-sm">
          <ImageCarousel images={w.images || []} alt={w.name} aspectRatio="h-44" containImage={true} />
          <div className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <h1 className="font-heading text-xl font-bold text-white truncate">{w.name}</h1>
                <div className="flex items-center gap-1.5 mt-0.5 text-sm text-neutral-400 font-body truncate">
                  <MapPin size={13} className="shrink-0" />
                  <span className="truncate">{w.location}</span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="font-heading text-lg font-bold text-[#84cc16] numeric">Rs. {w.pricePerShelf.toLocaleString("en-PK")}</p>
                <p className="text-[10px] text-neutral-500 font-body">per shelf / mo</p>
              </div>
            </div>
            {isOwnWarehouse && (
              <div className="mt-2.5">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-body font-medium">
                  <Warehouse size={11} /> You own this
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Right: KPI Cards Stacked */}
        <div className="flex flex-col gap-3">
          {[
            { icon: Package, label: "Total Shelves", value: w.totalShelves },
            { icon: Layers, label: "Available", value: detail?.available ?? "—" },
            { icon: DollarSign, label: "Price / Shelf", value: `Rs. ${w.pricePerShelf.toLocaleString("en-PK")}` },
          ].map((s, i) => (
            <motion.div key={s.label}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.1 + i * 0.08 }}
              className="flex items-center gap-3 p-3 rounded-xl bg-[#111614]/90 backdrop-blur-md border border-neutral-800/80 shadow-sm hover:shadow-md hover:border-[#84cc16]/40 hover:-translate-y-0.5 transition-all duration-300">
              <div className="w-9 h-9 rounded-lg bg-neutral-800/60 flex items-center justify-center shrink-0">
                <s.icon size={16} className="text-[#84cc16]" />
              </div>
              <div>
                <p className="font-heading text-lg font-bold text-white numeric leading-tight">{s.value}</p>
                <p className="text-[10px] text-neutral-400 font-body uppercase tracking-wider">{s.label}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Shelves Section */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }}
        className="bg-[#111614]/90 backdrop-blur-md rounded-3xl border border-neutral-800/80 shadow-sm p-5 sm:p-6">
        <h2 className="font-heading text-lg font-semibold text-white mb-4">Shelves</h2>

        {isOwnWarehouse && !shelvesLoading && shelves.length > 0 && (
          <div className="flex items-center gap-1.5 mb-4">
            {["all", "available", "booked"].map((tab) => {
              const isActive = shelfFilter === tab;
              return (
                <button key={tab} onClick={() => setShelfFilter(tab as typeof shelfFilter)}
                  className={`px-4 py-1.5 rounded-full text-xs font-body font-medium transition-all duration-200 ${
                    isActive ? "bg-[#1a231d] text-[#84cc16] border border-[#84cc16]/40 font-semibold shadow-lg shadow-[#84cc16]/10" : "bg-white/5 border border-neutral-800 text-neutral-400 hover:text-white hover:border-[#84cc16]/40"
                  }`}>
                  {tab === "all" ? "All Shelves" : tab === "available" ? "Available" : "Booked"}
                </button>
              );
            })}
          </div>
        )}

        {shelvesLoading ? (
          <div className="flex justify-center py-12"><Loader2 size={24} className="animate-spin text-[#84cc16]" /></div>
        ) : shelves.length === 0 ? (
          <div className="text-center py-10"><Layers size={32} className="mx-auto text-[#84cc16]/30 mb-3" /><p className="text-sm text-neutral-400 font-body">No shelves available.</p></div>
        ) : (
          <>
            <div className="hidden sm:grid grid-cols-[1fr_90px_105px] gap-2 px-4 py-2 bg-neutral-900/80 rounded-xl border border-neutral-800 mb-1">
              <span className="text-[10px] font-semibold tracking-wider text-neutral-400 uppercase font-body">Shelf</span>
              <span className="text-[10px] font-semibold tracking-wider text-neutral-400 uppercase font-body">Status</span>
              <span className="text-[10px] font-semibold tracking-wider text-neutral-400 uppercase font-body text-right">Rate / Mo</span>
            </div>
            <div className="space-y-1">
              {filteredShelves.map((shelf) => (
                <div key={shelf._id}
                  className={`grid grid-cols-[1fr_90px_105px] gap-2 items-center px-4 py-3 rounded-xl border transition-all duration-200 bg-neutral-900/60 border-neutral-800 hover:bg-neutral-800/60 ${
                    shelf.status !== "available" ? "opacity-60" : ""
                  }`}>
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${shelf.status === "available" ? "bg-[#84cc16]/10" : "bg-white/5"}`}>
                      <Layers size={14} className={shelf.status === "available" ? "text-[#84cc16]" : "text-neutral-600"} />
                    </div>
                    <span className="font-semibold text-sm text-white font-body truncate">Shelf #{shelf.shelfNumber}</span>
                  </div>
                  <div>
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-body font-medium border ${
                      shelf.status === "available" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-amber-500/10 border-amber-500/20 text-amber-400"
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${shelf.status === "available" ? "bg-emerald-500" : "bg-amber-500"}`} />
                      {shelf.status === "available" ? "Available" : "Booked"}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-semibold text-white font-body numeric">Rs. {(shelf?.pricePerMonth ?? 0).toLocaleString("en-PK")}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 text-xs text-neutral-500 font-body">
              Showing {filteredShelves.length} of {shelves.length} shelf{filteredShelves.length !== 1 ? "s" : ""}
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}

// ─── Warehouses List Tab ────────────────────────────────────────────────────────

function WarehousesTab({ onViewWarehouse, onEditWarehouse, onManageShelves, refreshKey = 0 }: {
  onViewWarehouse: (id: string) => void;
  onEditWarehouse: (w: WarehouseData) => void;
  onManageShelves: (w: WarehouseData) => void;
  refreshKey?: number;
}) {
  const { accessToken } = useAppSelector((s) => s.auth);
  const [warehouses, setWarehouses] = useState<WarehouseData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (!accessToken) return; let c = false; (async () => { try { const r = await api.get("/warehouse/my-warehouses"); const d = r.data.data; if (!c) setWarehouses(d.warehouses || []); } catch {} finally { if (!c) setLoading(false); } })(); return () => { c = true; }; }, [accessToken, refreshKey]);

  if (loading) return <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{[...Array(3)].map((_, i) => <div key={i} className="bg-[#111614] rounded-2xl h-52 border border-neutral-800/80 animate-pulse" />)}</div>;
  if (warehouses.length === 0) return (
    <div className="text-center py-16 bg-[#111614]/90 backdrop-blur-md rounded-3xl border border-neutral-800/80 shadow-sm">
      <div className="w-16 h-16 rounded-2xl bg-neutral-800/60 flex items-center justify-center mx-auto mb-4"><Building2 size={28} className="text-[#84cc16]/40" /></div>
      <h3 className="font-heading text-lg font-semibold text-white mb-2">No warehouses yet</h3>
      <p className="text-sm text-neutral-400 font-body mb-6 max-w-sm mx-auto">Create your first listing and start earning.</p>
      <button onClick={() => {}} className="inline-flex items-center gap-2 px-6 py-3 bg-[#1a231d] text-[#84cc16] border border-[#84cc16]/40 rounded-full text-sm font-semibold hover:bg-[#222e26] hover:border-[#84cc16]/60 hover:shadow-lg hover:shadow-[#84cc16]/10 transition-all"><Plus size={16} /> Add Your First Warehouse</button>
    </div>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {warehouses.map((w) => (
        <div key={w._id} className="group bg-[#111614]/90 backdrop-blur-md border border-neutral-800/80 shadow-[0_8px_30px_rgba(0,0,0,0.4)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.5)] hover:-translate-y-1.5 hover:border-[#84cc16]/40 transition-all duration-300 rounded-3xl overflow-hidden flex flex-col">
          <div className="h-2 bg-gradient-to-r from-[#84cc16] to-[#84cc16]/40" />
          <div className="p-5 flex flex-col flex-1">
            <h3 className="font-heading text-lg font-semibold text-white mb-1">{w.name}</h3>
            <div className="flex items-center gap-1.5 text-xs text-neutral-400 font-body mb-3"><MapPin size={12} /><span className="truncate">{w.location}</span></div>
            <div className="flex items-center justify-between text-xs text-neutral-400 font-body mb-4">
              <button
                onClick={() => onManageShelves(w)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 -ml-2.5 rounded-full hover:bg-[#84cc16]/10 transition-colors group"
                title="Manage shelves"
              >
                <strong className="text-white numeric group-hover:text-[#84cc16] transition-colors">{w.totalShelves}</strong>
                shelves
              </button>
              <span><strong className="text-white numeric">Rs. {w.pricePerShelf}</strong>/shelf/mo</span>
            </div>
            <div className="mt-auto flex items-center gap-2 pt-3 border-t border-neutral-800">
              <button onClick={() => onViewWarehouse(w._id)} className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 border border-[#84cc16]/30 text-[#84cc16] rounded-full text-xs font-medium hover:bg-[#84cc16]/10 transition-colors"><Eye size={14} /> View</button>
              <button onClick={() => onManageShelves(w)} className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 border border-neutral-700 text-neutral-300 rounded-full text-xs font-medium hover:border-[#84cc16]/40 hover:text-[#84cc16] hover:bg-[#84cc16]/5 transition-all"><Layers size={14} /> Shelves</button>
              <button onClick={() => onEditWarehouse(w)} className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-[#1a231d] text-[#84cc16] border border-[#84cc16]/40 rounded-full text-xs font-semibold hover:bg-[#222e26] hover:border-[#84cc16]/60 transition-all"><Edit3 size={14} /> Edit</button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB: ADD WAREHOUSE — Full Creation Form
// ═══════════════════════════════════════════════════════════════════════════════

function AddWarehouseTab() {
  const { accessToken } = useAppSelector((s) => s.auth);

  // ─── Form State ──────────────────────────────────────────────────────────────
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [pricePerShelf, setPricePerShelf] = useState("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ─── File handler ────────────────────────────────────────────────────────────
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const remaining = 5 - imageFiles.length;
    const toAdd = files.slice(0, remaining);
    setImageFiles((prev) => [...prev, ...toAdd]);
    setImagePreviews((prev) => [...prev, ...toAdd.map((f) => URL.createObjectURL(f))]);
  }, [imageFiles.length]);

  const removeImage = useCallback((index: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => { URL.revokeObjectURL(prev[index]); return prev.filter((_, i) => i !== index); });
  }, []);

  // ─── Validation ──────────────────────────────────────────────────────────────
  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = "Warehouse name is required";
    if (!location.trim()) errs.location = "Location is required";
    if (!pricePerShelf || parseFloat(pricePerShelf) <= 0) errs.pricePerShelf = "Price must be greater than 0";
    if (latitude === null || longitude === null) errs.coordinates = "Please select a location on the map";
    if (uploadedUrls.length === 0 && imageFiles.length === 0) errs.images = "Please upload at least one image";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ─── Submit ──────────────────────────────────────────────────────────────────
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);
    setErrors({});

    let finalUrls = [...uploadedUrls];
    if (imageFiles.length > 0) {
      setUploadingImage(true);
      try {
        for (const file of imageFiles) {
          const result = await uploadToCloudinary(file);
          finalUrls.push(result.secure_url);
        }
        setUploadedUrls(finalUrls);
        setImageFiles([]);
        setImagePreviews([]);
      } catch (err: any) {
        setApiError(err.message || "Failed to upload images");
        setUploadingImage(false);
        return;
      }
      setUploadingImage(false);
    }

    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await api.post("/warehouse/create", {
        name: name.trim(),
        location: location.trim(),
        latitude,
        longitude,
        pricePerShelf: parseFloat(pricePerShelf),
        images: finalUrls,
      });
      setSuccess(true);
      // Reset form
      setName(""); setLocation(""); setPricePerShelf(""); setLatitude(null); setLongitude(null);
      setImageFiles([]); setImagePreviews([]); setUploadedUrls([]);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setApiError(err.response?.data?.message || "Failed to create warehouse");
    } finally {
      setIsSubmitting(false);
    }
  }, [name, location, pricePerShelf, latitude, longitude, imageFiles, uploadedUrls]);

  return (
    <div className="max-w-4xl mx-auto py-6">
      <div className="bg-[#111614]/90 backdrop-blur-md rounded-3xl shadow-xl border border-neutral-800/80 p-8 md:p-10">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-neutral-800/60 flex items-center justify-center">
            <Warehouse size={20} className="text-[#84cc16]" />
          </div>
          <h1 className="font-heading text-2xl font-bold text-white tracking-tight">Add Warehouse</h1>
        </div>

        {/* Success */}
        {success && (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3 mb-6">
            <CheckCircle size={20} className="text-emerald-400 shrink-0" />
            <p className="text-sm text-emerald-400 font-body">Warehouse created successfully!</p>
          </div>
        )}

        {/* API Error */}
        {apiError && (
          <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-start gap-3 mb-6">
            <AlertCircle size={18} className="text-red-400 shrink-0 mt-0.5" />
            <p className="text-sm text-red-400 font-body">{apiError}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name */}
          <Input dark label="Warehouse Name" placeholder="e.g. Downtown Storage Hub" icon={Warehouse}
            value={name} onChange={(e) => setName(e.target.value)} error={errors.name}
            className={`bg-neutral-800/80! ${errors.name ? "border-red-500! bg-red-950/20!" : "border-neutral-700/80!"} text-white placeholder-neutral-500! focus:border-[#84cc16] focus:outline-none focus:ring-1 focus:ring-[#84cc16]/50!`} />

          {/* Location */}
          <Input dark label="Address / Area" placeholder="e.g. Gulistan-e-Johar, Karachi" icon={MapPin}
            value={location} onChange={(e) => setLocation(e.target.value)} error={errors.location}
            className={`bg-neutral-800/80! ${errors.location ? "border-red-500! bg-red-950/20!" : "border-neutral-700/80!"} text-white placeholder-neutral-500! focus:border-[#84cc16] focus:outline-none focus:ring-1 focus:ring-[#84cc16]/50!`} />

          {/* Price */}
          <Input dark label="Price Per Shelf (Rs.)" type="number" placeholder="e.g. 1500" icon={DollarSign}
            value={pricePerShelf} onChange={(e) => setPricePerShelf(e.target.value)} error={errors.pricePerShelf} min={0} step={100}
            className={`bg-neutral-800/80! ${errors.pricePerShelf ? "border-red-500! bg-red-950/20!" : "border-neutral-700/80!"} text-white placeholder-neutral-500! focus:border-[#84cc16] focus:outline-none focus:ring-1 focus:ring-[#84cc16]/50!`} />

          {/* Map Picker */}
          <MapPicker dark latitude={latitude} longitude={longitude} onChange={(lat, lng) => { setLatitude(lat); setLongitude(lng); }} />
          {errors.coordinates && <p className="text-red-400 text-xs mt-1 ml-1 font-body">{errors.coordinates}</p>}

          {/* Image Upload */}
          <div>
            <label className="text-xs font-semibold tracking-wider text-white uppercase mb-3 block font-body">Images (Max 5)</label>
            {imagePreviews.length > 0 && (
              <div className="flex flex-wrap gap-3 mb-4">
                {imagePreviews.map((src, i) => <ImagePreview key={i} src={src} onRemove={() => removeImage(i)} />)}
              </div>
            )}
            {uploadedUrls.length > 0 && (
              <div className="flex flex-wrap gap-3 mb-4">
                {uploadedUrls.map((url, i) => (
                  <ImagePreview key={`u-${i}`} src={url} onRemove={() => setUploadedUrls((p) => p.filter((_, idx) => idx !== i))} />
                ))}
              </div>
            )}
            {imageFiles.length + uploadedUrls.length < 5 && (
              <div onClick={() => fileInputRef.current?.click()}
                className="w-24 h-24 md:w-28 md:h-28 rounded-xl border-2 border-dashed border-[#84cc16]/30 hover:border-[#84cc16]/40 bg-white/5 flex flex-col items-center justify-center gap-1 cursor-pointer transition-all hover:bg-white/10 shrink-0">
                <Plus size={20} className="text-[#84cc16]/50" />
                <span className="text-[10px] text-[#84cc16]/50 font-body">Add Image</span>
              </div>
            )}
            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple className="hidden" onChange={handleFileSelect} />
            {errors.images && <p className="text-red-400 text-xs mt-2 font-body">{errors.images}</p>}
          </div>

          {/* Submit */}
          <div className="pt-4">
            <button type="submit" disabled={isSubmitting || uploadingImage}
              className="w-full inline-flex items-center justify-center gap-2.5 px-6 py-3.5 bg-[#1a231d] text-[#84cc16] border border-[#84cc16]/40 rounded-full font-body font-semibold text-sm hover:bg-[#222e26] hover:border-[#84cc16]/60 hover:shadow-lg hover:shadow-[#84cc16]/10 active:scale-95 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed">
              {uploadingImage ? (
                <><Loader2 size={18} className="animate-spin" /> Uploading Images...</>
              ) : isSubmitting ? (
                <><Loader2 size={18} className="animate-spin" /> Creating Warehouse...</>
              ) : (
                <><Plus size={18} /> Create Warehouse</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB: ORDERS & DISPATCH (Fulfillment Pipeline — STEP 4)
// ═══════════════════════════════════════════════════════════════════════════════

interface OwnerOrderData {
  _id: string;
  orderId: string;
  merchant?: { _id: string; name: string; email?: string };
  warehouse?: { _id: string; name: string; location?: string };
  customerDetails: { name: string; phone: string; address: string; city: string };
  orderedItems: Array<{ itemName: string; sku?: string; quantity: number }>;
  status: string;
  trackingId?: string | null;
  dispatchTimestamp?: string | null;
  courierDetails?: { courierName?: string; trackingId?: string; trackingUrl?: string } | null;
  timeline?: Array<{ status: string; timestamp?: string; note?: string }> | null;
  createdAt: string;
}

function orderStatusPill(status: string) {
  const map: Record<string, string> = {
    "Pending Packing": "bg-amber-500/10 border-amber-500/30 text-amber-400",
    Packed: "bg-sky-500/10 border-sky-500/30 text-sky-400",
    Dispatched: "bg-[#84cc16]/10 border-[#84cc16]/30 text-[#84cc16]",
    "In Transit": "bg-[#84cc16]/10 border-[#84cc16]/30 text-[#84cc16]",
    Delivered: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400",
    Cancelled: "bg-red-500/10 border-red-500/30 text-red-400",
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider border ${map[status] || "bg-neutral-500/10 border-neutral-500/30 text-neutral-400"}`}>
      <ClipboardList size={10} />
      {status}
    </span>
  );
}

function OrdersDispatchTab() {
  const { accessToken } = useAppSelector((s) => s.auth);
  const [orders, setOrders] = useState<OwnerOrderData[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [actingId, setActingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // ─── Dispatch modal state ──────────────────────────────────────────────
  const [dispatchTarget, setDispatchTarget] = useState<OwnerOrderData | null>(null);
  // ─── Delivery confirmation modal state ─────────────────────────────────
  const [deliveredTarget, setDeliveredTarget] = useState<OwnerOrderData | null>(null);

  const fetchOrders = useCallback(async () => {
    if (!accessToken) return;
    try {
      const res = await api.get("/order/warehouse-orders");
      setOrders(Array.isArray(res.data.data) ? res.data.data : []);
    } catch { } finally { setLoading(false); }
  }, [accessToken]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  const markPacked = useCallback(async (orderId: string) => {
    setActingId(orderId);
    try {
      await api.patch(`/order/${orderId}/mark-packed`);
      setToast({ message: "Order marked as packed.", type: "success" });
      fetchOrders();
    } catch (err: any) {
      setToast({ message: err.response?.data?.message || "Failed to update the order.", type: "error" });
    } finally { setActingId(null); }
  }, [fetchOrders]);

  const handleDispatched = useCallback(() => {
    setToast({ message: "Order dispatched — merchant notified.", type: "success" });
    setDispatchTarget(null);
    fetchOrders();
  }, [fetchOrders]);

  const handleDelivered = useCallback(() => {
    setToast({ message: "Order marked as delivered.", type: "success" });
    setDeliveredTarget(null);
    fetchOrders();
  }, [fetchOrders]);

  const filters = [
    { id: "all", label: "All" },
    { id: "Pending Packing", label: "Pending Packing" },
    { id: "Packed", label: "Packed" },
    { id: "transit", label: "In Transit / Dispatched" },
    { id: "Delivered", label: "Delivered" },
  ];
  const filteredOrders = orders.filter((o) => {
    if (filter === "all") return true;
    if (filter === "transit") return o.status === "Dispatched" || o.status === "In Transit";
    return o.status === filter;
  });
  const pendingCount = orders.filter((o) => o.status === "Pending Packing").length;
  const courierNameFor = (o: OwnerOrderData) => o.courierDetails?.courierName || "";

  return (
    <div>
      {/* Toast */}
      <AnimatePresence>{toast && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
          className={`fixed top-28 right-6 z-[70] flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl border backdrop-blur-md ${toast.type === "success" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-300" : "bg-red-500/10 border-red-500/20 text-red-300"}`}>
          {toast.type === "success" ? <CheckCircle size={18} className="shrink-0 text-emerald-500" /> : <AlertCircle size={18} className="shrink-0 text-red-500" />}
          <span className="text-sm font-body font-medium">{toast.message}</span>
        </motion.div>
      )}</AnimatePresence>

      {/* Header stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Orders", value: orders.length, icon: ClipboardList },
          { label: "Pending Packing", value: pendingCount, icon: Clock },
          { label: "Packed", value: orders.filter((o) => o.status === "Packed").length, icon: Package },
          { label: "Dispatched / In Transit", value: orders.filter((o) => o.status === "Dispatched" || o.status === "In Transit").length, icon: Truck },
        ].map((k) => (
          <div key={k.label} className="bg-[#111614]/90 backdrop-blur-md rounded-2xl p-4 border border-neutral-800/80 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-neutral-800/60 flex items-center justify-center"><k.icon size={17} className="text-[#84cc16]" /></div>
              <div><p className="font-heading text-xl font-bold text-white numeric">{k.value}</p><p className="text-[11px] text-neutral-400 font-body">{k.label}</p></div>
            </div>
          </div>
        ))}
      </div>

      {/* Filter pills */}
      <div className="flex items-center gap-1.5 mb-6 overflow-x-auto">
        {filters.map((f) => {
          const isActive = filter === f.id;
          return (
            <button key={f.id} onClick={() => setFilter(f.id)}
              className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-body font-medium transition-all duration-200 ${isActive ? "bg-[#1a231d] text-[#84cc16] border border-[#84cc16]/40 font-semibold shadow-lg shadow-[#84cc16]/10" : "bg-white/5 border border-neutral-800 text-neutral-400 hover:text-white hover:border-[#84cc16]/40"}`}>
              {f.label}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="space-y-4">{[1, 2].map((i) => <div key={i} className="bg-[#111614]/90 backdrop-blur-md rounded-3xl border border-neutral-800/80 p-6 animate-pulse"><div className="h-5 bg-neutral-800/60 rounded w-40 mb-4" /><div className="h-32 bg-neutral-800/60 rounded-2xl" /></div>)}</div>
      ) : orders.length === 0 ? (
        <div className="text-center py-16 bg-[#111614]/90 backdrop-blur-md rounded-3xl border border-neutral-800/80 shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-neutral-800/60 flex items-center justify-center mx-auto mb-4"><Truck size={28} className="text-[#84cc16]/40" /></div>
          <h3 className="font-heading text-lg font-semibold text-white mb-2">No orders yet</h3>
          <p className="text-sm text-neutral-400 font-body max-w-sm mx-auto">When a merchant creates a dispatch order, it will appear here for packing and dispatch.</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="text-center py-12 bg-[#111614]/90 backdrop-blur-md rounded-3xl border border-neutral-800/80">
          <ClipboardList size={26} className="mx-auto text-[#84cc16]/30 mb-3" />
          <p className="text-sm text-neutral-400 font-body">No orders with status “{filters.find((f) => f.id === filter)?.label || filter}”.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {filteredOrders.map((order, i) => {
            const totalQty = order.orderedItems.reduce((s, it) => s + (it.quantity || 0), 0);
            return (
              <motion.div key={order._id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: i * 0.04 }}
                className="bg-[#111614]/90 backdrop-blur-md rounded-3xl border border-neutral-800/80 shadow-sm hover:border-[#84cc16]/30 transition-colors duration-200 p-5 sm:p-6">
                {/* Header */}
                <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-neutral-800/60 flex items-center justify-center shrink-0">
                      <Truck size={18} className="text-[#84cc16]" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-sm font-bold text-white font-mono">{order.orderId}</span>
                      <p className="text-xs text-neutral-400 font-body truncate mt-0.5">
                        {order.warehouse?.name || "Warehouse"} · {order.merchant?.name || "Merchant"}
                      </p>
                    </div>
                  </div>
                  {orderStatusPill(order.status)}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  {/* Ship To */}
                  <div className="p-4 rounded-2xl bg-neutral-900/60 border border-neutral-800">
                    <p className="text-[10px] font-semibold tracking-wider text-neutral-500 uppercase mb-2 font-body">Ship To</p>
                    <p className="text-sm font-semibold text-white font-body">{order.customerDetails?.name || "—"}</p>
                    <p className="text-xs text-neutral-400 font-body mt-1">{order.customerDetails?.phone} · {order.customerDetails?.city}</p>
                    <p className="text-xs text-neutral-500 font-body mt-1 truncate">{order.customerDetails?.address}</p>
                  </div>
                  {/* Items */}
                  <div className="p-4 rounded-2xl bg-neutral-900/60 border border-neutral-800">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[10px] font-semibold tracking-wider text-neutral-500 uppercase font-body">Items ({totalQty})</p>
                    </div>
                    <div className="space-y-1.5">
                      {order.orderedItems.map((it, idx) => (
                        <div key={`${it.itemName}-${idx}`} className="flex items-center justify-between gap-2 text-xs font-body">
                          <span className="text-white truncate">{it.itemName}</span>
                          <span className="text-[#84cc16] font-bold numeric shrink-0">× {it.quantity}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Action footer */}
                {order.status === "Pending Packing" && (
                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-800">
                    <button onClick={() => markPacked(order._id)} disabled={actingId === order._id}
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1a231d] text-[#84cc16] border border-[#84cc16]/40 rounded-full text-xs font-body font-semibold hover:bg-[#222e26] hover:border-[#84cc16]/60 hover:shadow-lg hover:shadow-[#84cc16]/10 active:scale-95 transition-all duration-200 disabled:opacity-60">
                      {actingId === order._id ? <><Loader2 size={14} className="animate-spin" />Updating...</> : <><Package size={14} />Mark as Packed</>}
                    </button>
                  </div>
                )}

                {order.status === "Packed" && (
                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-800">
                    <button onClick={() => setDispatchTarget(order)} disabled={actingId === order._id}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-[#1a231d] text-[#84cc16] border border-[#84cc16]/40 rounded-full text-xs font-body font-semibold hover:bg-[#222e26] hover:border-[#84cc16]/60 hover:shadow-lg hover:shadow-[#84cc16]/10 active:scale-95 transition-all duration-200 disabled:opacity-60">
                      <Truck size={14} />Dispatch Order
                    </button>
                  </div>
                )}

                {(order.status === "Dispatched" || order.status === "In Transit") && (
                  <div className="flex items-center justify-between gap-3 pt-4 border-t border-neutral-800 flex-wrap">
                    <div className="flex items-center gap-2 text-xs font-body flex-wrap">
                      <span className="text-neutral-500">Via:</span>
                      <span className="font-semibold text-white">{courierNameFor(order) || "Courier"}</span>
                      <span className="text-neutral-600">·</span>
                      <span className="text-neutral-500">Tracking:</span>
                      <span className="font-mono text-[#84cc16] font-semibold">{order.courierDetails?.trackingId || order.trackingId || "—"}</span>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-[11px] text-neutral-500 font-body">
                        Dispatched {order.dispatchTimestamp ? formatDateTime(order.dispatchTimestamp) : ""}
                      </span>
                      <button onClick={() => setDeliveredTarget(order)}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-full text-xs font-body font-semibold hover:bg-emerald-500/20 hover:border-emerald-500/50 hover:shadow-lg hover:shadow-emerald-500/10 active:scale-95 transition-all duration-200">
                        <CheckCircle size={14} />Mark Delivered
                      </button>
                    </div>
                  </div>
                )}

                {order.status === "Delivered" && (
                  <div className="flex items-center justify-between gap-3 pt-4 border-t border-neutral-800">
                    <div className="flex items-center gap-2 text-xs font-body">
                      <span className="text-neutral-500">Via:</span>
                      <span className="font-semibold text-white">{courierNameFor(order) || "Courier"}</span>
                      <span className="text-neutral-600">·</span>
                      <span className="text-neutral-500">Tracking:</span>
                      <span className="font-mono text-[#84cc16] font-semibold">{order.courierDetails?.trackingId || order.trackingId || "—"}</span>
                    </div>
                    <span className="inline-flex items-center gap-1.5 text-[11px] text-emerald-400 font-body font-medium">
                      <CheckCircle size={13} /> Delivered to customer
                    </span>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* ═══ DISPATCH ORDER MODAL (self-contained) ═══ */}
      <AnimatePresence>
        {dispatchTarget && (
          <DispatchOrderModal
            order={dispatchTarget}
            onClose={() => setDispatchTarget(null)}
            onDispatched={handleDispatched}
          />
        )}
      </AnimatePresence>

      {/* ═══ DELIVERY CONFIRMATION MODAL (self-contained) ═══ */}
      <AnimatePresence>
        {deliveredTarget && (
          <DeliveryConfirmationModal
            order={deliveredTarget}
            onClose={() => setDeliveredTarget(null)}
            onDelivered={handleDelivered}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB: PROFILE — Full Profile Management
// ═══════════════════════════════════════════════════════════════════════════════

function ProfileTab() {
  const dispatch = useAppDispatch();
  const { accessToken } = useAppSelector((s) => s.auth);
  const { user: profileUser, isLoading, isUpdating, error, successMessage } = useAppSelector((s) => s.profile);
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const router = useRouter();
  const hasFetched = useRef(false);

  useEffect(() => {
    if (accessToken && !hasFetched.current) {
      hasFetched.current = true;
      dispatch(fetchProfile());
    }
  }, [accessToken, dispatch]);

  useEffect(() => {
    if (profileUser) {
      setPhone(profileUser.phone || "");
      setRole(profileUser.role || "");
    }
  }, [profileUser]);

  useEffect(() => {
    if (successMessage) {
      setToast({ message: successMessage, type: "success" });
      dispatch(clearProfileSuccess());
    }
  }, [successMessage, dispatch]);

  useEffect(() => {
    if (error) {
      setToast({ message: error, type: "error" });
      dispatch(clearProfileError());
    }
  }, [error, dispatch]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  const handleSave = useCallback(async () => {
    const payload: { phone?: string; role?: string } = {};
    if (phone !== (profileUser?.phone || "")) payload.phone = phone;
    if (role !== (profileUser?.role || "")) payload.role = role;
    if (Object.keys(payload).length === 0) {
      setToast({ message: "No changes to save.", type: "error" });
      return;
    }
    try {
      const result = await dispatch(updateProfile(payload)).unwrap();
      if (result.user) {
        const u = result.user;
        dispatch(setUser({
          id: u._id || u.id || null,
          email: u.email || null,
          role: u.role || null,
          name: u.name || null,
        }));
      }
      // Role-based redirect (fires regardless of result.user)
      if (payload.role) {
        if (payload.role === "merchant") {
          router.push("/");
        } else if (payload.role === "warehouseOwner") {
          router.push("/dashboard");
        }
      }
    } catch {
      // handled by Redux
    }
  }, [phone, role, profileUser, dispatch, router]);

  if (isLoading && !profileUser) {
    return (
      <div className="max-w-3xl mx-auto py-6">
        <div className="bg-[#111614]/90 backdrop-blur-md rounded-3xl shadow-xl border border-neutral-800/80 p-8 md:p-10 animate-pulse">
          <div className="h-8 bg-neutral-800/60 rounded-lg w-40 mb-8" />
          <div className="flex items-center gap-5 mb-8">
            <div className="w-16 h-16 rounded-2xl bg-neutral-800/60" />
            <div className="space-y-2 flex-1"><div className="h-5 bg-neutral-800/60 rounded w-48" /><div className="h-4 bg-neutral-800/60 rounded w-64" /></div>
          </div>
          <div className="space-y-6">
            <div className="h-12 bg-neutral-800/60 rounded-xl w-full" />
            <div className="h-12 bg-neutral-800/60 rounded-xl w-full" />
            <div className="h-12 bg-neutral-800/60 rounded-full w-full mt-8" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-6 relative">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
            className={`mb-6 p-4 rounded-2xl border flex items-center gap-3 ${
              toast.type === "success" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-300" : "bg-red-500/10 border-red-500/20 text-red-300"
            }`}>
            {toast.type === "success" ? <CheckCircle size={20} className="shrink-0 text-emerald-500" /> : <XCircle size={20} className="shrink-0 text-red-500" />}
            <span className="text-sm font-body font-medium flex-1">{toast.message}</span>
            <button onClick={() => setToast(null)} className="p-1 rounded-full hover:bg-white/10"><X size={14} className="opacity-50" /></button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-[#111614]/90 backdrop-blur-md rounded-3xl shadow-xl border border-neutral-800/80 p-8 md:p-10">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-neutral-800/60 flex items-center justify-center">
            <User size={20} className="text-[#84cc16]" />
          </div>
          <h1 className="font-heading text-2xl font-bold text-white tracking-tight">My Profile</h1>
        </div>

        {/* User Card */}
        {profileUser && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}
            className="flex items-start gap-4 md:gap-5 p-5 md:p-6 rounded-2xl bg-white/5 border border-white/10 mb-6">
            <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-[#84cc16]/10 flex items-center justify-center shrink-0">
              <User size={28} className="text-[#84cc16]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="font-heading text-lg md:text-xl font-semibold text-white truncate">{profileUser.name}</h2>
                {profileUser.isVerified && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-body font-medium">
                    <ShieldCheck size={12} /> Verified
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 mt-1 text-sm text-neutral-400 font-body">
                <Mail size={14} /> <span className="truncate">{profileUser.email}</span>
              </div>
              <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/10 text-[11px] text-[#84cc16] font-body font-medium capitalize">
                {(() => {
                  const opt = roleOptions.find((r) => r.value === profileUser.role);
                  const Icon = opt?.icon || Store;
                  return <Icon size={12} />;
                })()}
                {profileUser.role === "warehouseOwner" ? "Warehouse Owner" : profileUser.role === "merchant" ? "Merchant" : "Worker"}
              </div>
            </div>
          </motion.div>
        )}

        {/* User ID row */}
        {profileUser && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.15 }}
            className="flex items-center justify-between bg-neutral-900/80 border border-neutral-800 rounded-xl p-3 md:p-4 mb-8">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-[10px] text-neutral-500 uppercase font-semibold tracking-wider whitespace-nowrap font-body">USER ID:</span>
              <code className="text-xs md:text-sm font-mono text-neutral-300 font-medium break-all">{profileUser._id || profileUser.id || "—"}</code>
            </div>
            <CopyButton value={profileUser._id || profileUser.id || ""} />
          </motion.div>
        )}

        {/* Editable Form */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }} className="space-y-6">
          {/* Phone */}
          <div>
            <label className="text-xs font-semibold tracking-wider text-white uppercase mb-1.5 block font-body">Phone Number</label>
            <div className="relative">
              <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#84cc16]/60 pointer-events-none" />
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 (555) 000-0000"
                className="w-full pl-11 pr-4 py-3.5 bg-neutral-900/80 border border-neutral-800 rounded-xl text-white placeholder:text-neutral-500 focus:outline-none focus:border-[#84cc16] focus:bg-neutral-900 transition-all text-sm font-body" />
            </div>
          </div>

          {/* Role Selector */}
          <div>
            <label className="text-xs font-semibold tracking-wider text-white uppercase mb-3 block font-body">Account Role</label>
            <div className="grid grid-cols-3 gap-2.5">
              {roleOptions.map((opt) => {
                const isActive = role === opt.value;
                return (
                  <button key={opt.value} type="button" onClick={() => setRole(opt.value)}
                    className={`flex flex-col items-center justify-center gap-1.5 p-4 min-h-[80px] rounded-xl border-2 text-sm font-body font-medium transition-all duration-200 ${
                      isActive
                        ? "bg-[#1a231d] text-[#84cc16] border-2 border-[#84cc16] shadow-lg shadow-[#84cc16]/10"
                        : "bg-transparent text-neutral-400 border-neutral-800 hover:border-[#84cc16]/40 hover:bg-white/5"
                    }`}>
                    <opt.icon size={20} />
                    <span className="text-[11px] leading-tight text-center">{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Save Button */}
          <div className="pt-4">
            <button onClick={handleSave} disabled={isUpdating}
              className="w-full inline-flex items-center justify-center gap-2.5 px-6 py-3.5 bg-[#1a231d] text-[#84cc16] border border-[#84cc16]/40 rounded-full font-body font-semibold text-sm hover:bg-[#222e26] hover:border-[#84cc16]/60 hover:shadow-lg hover:shadow-[#84cc16]/10 active:scale-95 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed">
              {isUpdating ? <><Loader2 size={18} className="animate-spin" /> Updating...</> : <><Save size={18} /> Save Changes</>}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB: VERIFICATIONS (Admin)
// ═══════════════════════════════════════════════════════════════════════════════

function VerificationsTab() {
  const { user, accessToken } = useAppSelector((s) => s.auth);
  const [users, setUsers] = useState<KycUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterStatus>("pending");
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const stRef = useRef<NodeJS.Timeout | null>(null);
  const [selected, setSelected] = useState<KycUser | null>(null);
  const [previewImg, setPreviewImg] = useState<string | null>(null);
  const [previewLabel, setPreviewLabel] = useState("");
  const [showReject, setShowReject] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => { if (stRef.current) clearTimeout(stRef.current); stRef.current = setTimeout(() => setDebounced(search), 350); return () => { if (stRef.current) clearTimeout(stRef.current); }; }, [search]);

  const counts = useMemo(() => {
    const c = { all: users.length, pending: 0, approved: 0, rejected: 0 };
    users.forEach((u) => { const s = u.verificationStatus as FilterStatus; if (s in c) c[s]++; });
    return c;
  }, [users]);

  const fetchVerifications = useCallback(async () => {
    try { setLoading(true); setError(null); const p = new URLSearchParams(); p.set("status", filter); if (debounced.trim()) p.set("search", debounced.trim()); const r = await api.get(`/admin/verifications?${p.toString()}`); setUsers(r.data.data || []); }
    catch (err: any) { setError(err.response?.data?.message || "Failed to load"); } finally { setLoading(false); }
  }, [filter, debounced]);

  useEffect(() => { if (accessToken && user) fetchVerifications(); }, [accessToken, user, fetchVerifications, filter, debounced]);

  const updateStatus = useCallback(async (userId: string, status: "approved" | "rejected" | "pending", reason?: string) => {
    if (status === "rejected" && !reason?.trim()) { setRejectTarget(userId); setShowReject(true); return; }
    setActionLoading(true);
    try { const r = await api.patch(`/admin/verifications/${userId}/status`, { status, reason: reason?.trim() || undefined }); const u = r.data.data; if (u) setUsers((p) => p.map((x) => (x._id === userId ? { ...x, ...u } : x))); else fetchVerifications(); setSelected(null); }
    catch (err: any) { setError(err.response?.data?.message || "Failed to update"); } finally { setActionLoading(false); }
  }, [fetchVerifications]);

  const handleRejectSubmit = useCallback(async () => {
    if (!rejectTarget || !rejectReason.trim()) return;
    setActionLoading(true);
    try { const r = await api.patch(`/admin/verifications/${rejectTarget}/status`, { status: "rejected", reason: rejectReason.trim() }); const u = r.data.data; if (u) setUsers((p) => p.map((x) => (x._id === rejectTarget ? { ...x, ...u } : x))); else fetchVerifications(); setShowReject(false); setRejectTarget(null); setRejectReason(""); setSelected(null); }
    catch (err: any) { setError(err.response?.data?.message || "Failed to reject"); } finally { setActionLoading(false); }
  }, [rejectTarget, rejectReason, fetchVerifications]);

  const sBadge = (status: string) => ({
    approved: { bg: "bg-emerald-500/10 border-emerald-500/20", text: "text-emerald-400", icon: CheckCircle, label: "Approved" },
    rejected: { bg: "bg-red-500/10 border-red-500/20", text: "text-red-400", icon: XCircle, label: "Rejected" },
  }[status] || { bg: "bg-amber-500/10 border-amber-500/20", text: "text-amber-400", icon: Clock, label: "Pending" });

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="flex items-center gap-1.5 bg-white/5 border border-neutral-800/80 rounded-2xl p-1.5 shadow-sm">
          {([{ k: "all", l: "All" }, { k: "pending", l: "Pending" }, { k: "approved", l: "Approved" }, { k: "rejected", l: "Rejected" }] as { k: FilterStatus; l: string }[]).map((t) => {
            const isActive = filter === t.k; const cnt = counts[t.k];
            return <button key={t.k} onClick={() => setFilter(t.k)} className={`relative flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-body font-medium transition-all duration-200 ${isActive ? "bg-[#1a231d] text-[#84cc16] border border-[#84cc16]/40 font-semibold shadow-lg shadow-[#84cc16]/10" : "text-neutral-400 hover:text-white hover:bg-white/10"}`}>{t.l}{cnt > 0 && <span className={`text-[11px] font-semibold px-1.5 py-0.5 rounded-full ${isActive ? "bg-black/20 text-black" : "bg-white/10 text-neutral-400"}`}>{cnt}</span>}</button>;
          })}
        </div>
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search users..." className="w-full pl-9 pr-3 py-2 bg-neutral-900/80 border border-neutral-800 rounded-xl text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:border-[#84cc16] transition-all font-body" />
        </div>
      </div>
      {error && <div className="mb-4 p-3 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center gap-2"><AlertCircle size={16} className="text-red-400 shrink-0" /><p className="text-sm text-red-400 font-body">{error}</p></div>}
      {loading && <div className="flex items-center justify-center py-16"><Loader2 size={28} className="animate-spin text-[#84cc16]" /></div>}
      {!loading && users.length === 0 && (
        <div className="text-center py-16 bg-[#111614]/90 backdrop-blur-md rounded-3xl border border-neutral-800/80 shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-neutral-800/60 flex items-center justify-center mx-auto mb-4"><CheckCircle size={28} className="text-emerald-400" /></div>
          <h3 className="font-heading text-lg font-semibold text-white mb-2">All caught up!</h3>
          <p className="text-sm text-neutral-400 font-body">No pending verification requests.</p>
        </div>
      )}
      {!loading && users.length > 0 && (
        <div className="space-y-3">
          {users.map((u) => { const b = sBadge(u.verificationStatus); const BI = b.icon; return (
            <div key={u._id} className="bg-[#111614]/90 backdrop-blur-md border border-neutral-800/80 shadow-sm rounded-3xl p-5">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="w-11 h-11 rounded-2xl bg-[#84cc16] flex items-center justify-center shrink-0"><User size={18} className="text-black" /></div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2.5 flex-wrap"><h3 className="font-heading text-base font-semibold text-white truncate">{u.name}</h3><span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${b.bg} ${b.text}`}><BI size={11} />{b.label}</span></div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-neutral-400 font-body"><span>{u.email}</span><span className="capitalize">Role: {u.role}</span><span>{formatDate(u.createdAt)}</span></div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => setSelected(u)} className="px-3.5 py-2 bg-[#1a231d] text-[#84cc16] border border-[#84cc16]/40 rounded-full text-xs font-semibold hover:bg-[#222e26] hover:border-[#84cc16]/60 hover:shadow-lg hover:shadow-[#84cc16]/10 transition-all">Review Docs</button>
                  {u.verificationStatus === "pending" && <><button onClick={() => updateStatus(u._id, "approved")} disabled={actionLoading} className="p-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 transition-all disabled:opacity-50" title="Approve"><ThumbsUp size={15} /></button><button onClick={() => updateStatus(u._id, "rejected")} disabled={actionLoading} className="p-2 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-all disabled:opacity-50" title="Reject"><ThumbsDown size={15} /></button></>}
                  {u.verificationStatus === "approved" && <><button onClick={() => updateStatus(u._id, "pending")} disabled={actionLoading} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 hover:bg-amber-500/20 transition-all text-xs font-medium disabled:opacity-50"><Undo2 size={13} /> Pending</button><button onClick={() => updateStatus(u._id, "rejected")} disabled={actionLoading} className="p-2 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-all disabled:opacity-50" title="Reject"><ThumbsDown size={15} /></button></>}
                  {u.verificationStatus === "rejected" && <><button onClick={() => updateStatus(u._id, "approved")} disabled={actionLoading} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 transition-all text-xs font-medium disabled:opacity-50"><ThumbsUp size={13} /> Approve</button><button onClick={() => updateStatus(u._id, "pending")} disabled={actionLoading} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 hover:bg-amber-500/20 transition-all text-xs font-medium disabled:opacity-50"><Undo2 size={13} /> Pending</button></>}
                </div>
              </div>
              {u.verificationStatus === "rejected" && u.rejectionReason && <div className="mt-3 pt-3 border-t border-red-500/20"><p className="text-xs text-red-400/80 font-body flex items-start gap-1.5"><AlertCircle size={12} className="mt-0.5 shrink-0" /><span><span className="font-medium">Reason:</span> {u.rejectionReason}</span></p></div>}
            </div>
          );})}
        </div>
      )}

      {/* Review Docs Modal */}
      <AnimatePresence>{selected && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={(e) => { if (e.target === e.currentTarget) setSelected(null); }}>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-3xl max-h-[85vh] overflow-y-auto bg-[#111614] rounded-3xl shadow-2xl border border-neutral-800/80">
            <div className="sticky top-0 bg-[#111614]/90 backdrop-blur-sm border-b border-neutral-800 px-6 py-4 flex items-center justify-between rounded-t-3xl">
              <div className="flex items-center gap-3"><div className="w-9 h-9 rounded-xl bg-neutral-800/60 flex items-center justify-center"><ShieldCheck size={18} className="text-[#84cc16]" /></div><div><h3 className="font-heading text-lg font-semibold text-white">KYC — {selected.name}</h3><p className="text-xs text-neutral-400 font-body">{selected.email}</p></div></div>
              <button onClick={() => setSelected(null)} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-neutral-400 hover:text-white hover:bg-white/20"><X size={16} /></button>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {(["nicFront", "nicBack"] as const).map((doc) => (
                  <div key={doc}><p className="text-xs font-semibold text-white uppercase mb-2 font-body">{doc === "nicFront" ? "NIC Front" : "NIC Back"}</p>
                    <div className="relative rounded-2xl overflow-hidden bg-neutral-900/80 border border-neutral-800 h-48 cursor-pointer hover:border-[#84cc16]/30 transition-all" onClick={() => { setPreviewImg(selected.kycDocuments?.[doc] || null); setPreviewLabel(doc === "nicFront" ? "NIC Front" : "NIC Back"); }}>
                      {selected.kycDocuments?.[doc] ? <img src={selected.kycDocuments[doc]!} alt={doc} className="w-full h-full object-contain p-2" /> : <div className="flex items-center justify-center h-full text-neutral-600"><ImageIcon size={32} /></div>}
                    </div>
                  </div>
                ))}
              </div>
              <div><p className="text-xs font-semibold text-white uppercase mb-2 font-body">Live Photo</p>
                <div className="relative rounded-2xl overflow-hidden bg-neutral-900/80 border border-neutral-800 h-48 cursor-pointer hover:border-[#84cc16]/30 transition-all" onClick={() => { setPreviewImg(selected.kycDocuments?.livePhoto || null); setPreviewLabel("Live Photo"); }}>
                  {selected.kycDocuments?.livePhoto ? <img src={selected.kycDocuments.livePhoto} alt="Live Photo" className="w-full h-full object-contain p-2" /> : <div className="flex items-center justify-center h-full text-neutral-600"><ImageIcon size={32} /></div>}
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-800">
                <button onClick={() => setSelected(null)} className="px-5 py-2.5 border border-neutral-800 text-neutral-400 rounded-full text-sm font-medium hover:bg-white/5 transition-all">Close</button>
                {selected.verificationStatus !== "approved" && <button onClick={() => { updateStatus(selected._id, "approved"); }} disabled={actionLoading} className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1a231d] text-[#84cc16] border border-[#84cc16]/40 rounded-full text-sm font-semibold hover:bg-[#222e26] hover:border-[#84cc16]/60 hover:shadow-lg hover:shadow-[#84cc16]/10 transition-all disabled:opacity-50">{actionLoading ? <Loader2 size={15} className="animate-spin" /> : <ThumbsUp size={15} />} Approve</button>}
                {selected.verificationStatus !== "rejected" && <button onClick={() => { setRejectTarget(selected._id); setShowReject(true); }} disabled={actionLoading} className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-full text-sm font-medium hover:bg-red-500/20 transition-all disabled:opacity-50"><ThumbsDown size={15} /> Reject</button>}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}</AnimatePresence>

      {/* Reject Modal */}
      <AnimatePresence>{showReject && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={(e) => { if (e.target === e.currentTarget) { setShowReject(false); setRejectTarget(null); setRejectReason(""); } }}>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-md bg-[#111614] rounded-3xl shadow-2xl border border-neutral-800/80 p-6">
            <h3 className="font-heading text-xl font-semibold text-white mb-2">Reject Verification</h3>
            <p className="text-sm text-neutral-400 font-body mb-5">Provide a reason visible to the user.</p>
            <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="Enter reason..." rows={3} className="w-full p-3 rounded-xl border border-neutral-800 text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:border-red-400 transition-all font-body resize-none" />
            <div className="flex items-center justify-end gap-3 mt-5">
              <button onClick={() => { setShowReject(false); setRejectTarget(null); setRejectReason(""); }} className="px-5 py-2.5 border border-neutral-800 text-neutral-400 rounded-full text-sm font-medium hover:bg-white/5 transition-all">Cancel</button>
              <button onClick={handleRejectSubmit} disabled={!rejectReason.trim() || actionLoading} className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-full text-sm font-medium hover:bg-red-500/20 transition-all disabled:opacity-50">{actionLoading ? <Loader2 size={15} className="animate-spin" /> : <ThumbsDown size={15} />} Submit</button>
            </div>
          </motion.div>
        </motion.div>
      )}</AnimatePresence>

      {/* Image Preview Modal */}
      <AnimatePresence>{previewImg && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={() => setPreviewImg(null)}>
          <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="relative" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setPreviewImg(null)} className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-white shadow-lg flex items-center justify-center z-10"><X size={16} /></button>
            <p className="text-white/70 text-sm font-body mb-3 text-center">{previewLabel}</p>
            <img src={previewImg} alt={previewLabel} className="max-w-full max-h-[75vh] rounded-2xl shadow-2xl" />
          </motion.div>
        </motion.div>
      )}</AnimatePresence>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PAGE — Tab state lives here per the spec
// ═══════════════════════════════════════════════════════════════════════════════

export default function DashboardPage() {
  const { user } = useAppSelector((s) => s.auth);
  const { unread } = useAppSelector((s) => s.notifications);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string | null>(null);
  const isAdmin = !!(user?.isAdmin || user?.role === "admin");

  // ─── Edit Warehouse modal state ─────────────────────────────────────────
  const [editingWarehouse, setEditingWarehouse] = useState<WarehouseData | null>(null);
  const [managingShelvesWarehouse, setManagingShelvesWarehouse] = useState<WarehouseData | null>(null);
  const [warehousesRefreshKey, setWarehousesRefreshKey] = useState(0);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // ─── Auto-clear toast ───────────────────────────────────────────────────
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  // ─── Handle warehouse saved: refetch + toast ───────────────────────────
  const handleWarehouseSaved = useCallback(() => {
    setEditingWarehouse(null);
    setWarehousesRefreshKey((k) => k + 1);
    setToast({ message: "Warehouse updated successfully", type: "success" });
  }, []);

  // When switching away from warehouses tab, reset selected warehouse
  useEffect(() => {
    if (activeTab !== "warehouses") setSelectedWarehouseId(null);
  }, [activeTab]);

  return (
    <div className="relative overflow-hidden min-h-screen bg-[#0a0d0c]">
      {/* Ambient smoky radial glows */}
      <div className="pointer-events-none fixed top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-[#84cc16]/10 blur-[130px] z-0" />
      <div className="pointer-events-none fixed bottom-[5%] right-[-5%] w-[450px] h-[450px] rounded-full bg-emerald-500/10 blur-[150px] z-0" />
      <Sidebar activeTab={activeTab} onTabChange={(tab) => { setActiveTab(tab); setSelectedWarehouseId(null); }} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} isAdmin={isAdmin} />
      <TopHeader onMenuToggle={() => setSidebarOpen(true)} unread={unread} />
      <main className="md:ml-60 pt-16">
        <div className="px-4 lg:px-6 py-6 relative z-10">
          {/* Tab header — show only when not in warehouse detail view */}
          {!(activeTab === "warehouses" && selectedWarehouseId) && (
            <div className="mb-6">
              <h1 className="font-heading text-2xl sm:text-3xl font-bold text-white tracking-tight">
                {activeTab === "overview" && "Dashboard"}
                {activeTab === "warehouses" && "My Warehouses"}
                {activeTab === "add-warehouse" && "Add Warehouse"}
                {activeTab === "orders" && "Orders & Dispatch"}
                {activeTab === "profile" && "Account / Profile"}
                {activeTab === "verifications" && "KYC Verifications"}
              </h1>
              <p className="mt-1 text-sm text-neutral-400 font-body">
                {activeTab === "overview" && "Here's your overview at a glance"}
                {activeTab === "warehouses" && "Manage your listed properties"}
                {activeTab === "add-warehouse" && "Create a new warehouse listing"}
                {activeTab === "orders" && "Pack and dispatch merchant orders"}
                {activeTab === "profile" && "Manage your account settings"}
                {activeTab === "verifications" && "Manage user identity verification requests"}
              </p>
            </div>
          )}
          {/* Tab content (fade-in on switch) */}
          <motion.div key={activeTab} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            {activeTab === "overview" && <OverviewTab />}
            {activeTab === "warehouses" && (
              selectedWarehouseId ? (
                <WarehouseDetailView warehouseId={selectedWarehouseId} onBack={() => setSelectedWarehouseId(null)} />
              ) : (
                <WarehousesTab
                  onViewWarehouse={(id) => setSelectedWarehouseId(id)}
                  onEditWarehouse={(w) => setEditingWarehouse(w)}
                  onManageShelves={(w) => setManagingShelvesWarehouse(w)}
                  refreshKey={warehousesRefreshKey}
                />
              )
            )}
            {activeTab === "add-warehouse" && <AddWarehouseTab />}
            {activeTab === "orders" && <OrdersDispatchTab />}
            {activeTab === "profile" && <ProfileTab />}
            {activeTab === "verifications" && <VerificationsTab />}
          </motion.div>
        </div>
      </main>

      {/* ═══ Success / Error Toast ═══ */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.25 }}
            className={`fixed top-20 right-6 z-[70] flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl border backdrop-blur-md ${
              toast.type === "success"
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-300"
                : "bg-red-500/10 border-red-500/20 text-red-300"
            }`}
          >
            {toast.type === "success" ? (
              <CheckCircle size={18} className="shrink-0 text-emerald-500" />
            ) : (
              <AlertCircle size={18} className="shrink-0 text-red-500" />
            )}
            <span className="text-sm font-body font-medium">{toast.message}</span>
            <button
              onClick={() => setToast(null)}
              className="ml-1 p-1 rounded-full hover:bg-white/10 transition-colors"
            >
              <X size={14} className="opacity-50" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ Edit Warehouse Modal ═══ */}
      <AnimatePresence>
        {editingWarehouse && (
          <EditWarehouseModal
            warehouseId={editingWarehouse._id}
            warehouseName={editingWarehouse.name}
            onClose={() => setEditingWarehouse(null)}
            onSaved={handleWarehouseSaved}
          />
        )}
      </AnimatePresence>

      {/* ═══ Manage Shelves Modal ═══ */}
      <AnimatePresence>
        {managingShelvesWarehouse && (
          <ManageShelvesModal
            warehouseId={managingShelvesWarehouse._id}
            warehouseName={managingShelvesWarehouse.name}
            pricePerShelf={managingShelvesWarehouse.pricePerShelf}
            onClose={() => setManagingShelvesWarehouse(null)}
            onUpdated={() => setWarehousesRefreshKey((k) => k + 1)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
