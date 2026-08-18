"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import {
  Menu,
  X,
  User,
  LogIn,
  LogOut,
  Compass,
  ChevronDown,
  CalendarDays,
  Info,
  Mail,
  Bell,
  BellOff,
  ChevronRight,
  Scan, 
  ShieldCheck,
  LayoutDashboard,
  MessageCircle,
  Newspaper,
  House,
  LifeBuoy,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { logout as logoutAction } from "@/redux/slices/authSlice";
import {
  fetchNotifications,
  markNotificationAsRead,
  readAllNotifications,
} from "@/redux/slices/notificationSlice";
import type { Notification } from "@/redux/slices/notificationSlice";

// ─── Notification helpers ───────────────────────────────────────────────────────

type NotificationCategory = "booking" | "inbound" | "payment" | "system";

// Bucket a notification into a category by scanning its title + message.
function notificationCategory(
  n: Pick<Notification, "title" | "message">
): NotificationCategory {
  const text = `${n.title || ""} ${n.message}`.toLowerCase();
  if (/(booking|confirmed|declined|rejected|cancelled|cancel)/.test(text))
    return "booking";
  if (/(payment|paid|proof|invoice)/.test(text)) return "payment";
  if (/(inbound|dispatch|shipment|order|pickup|deliver|carton)/.test(text))
    return "inbound";
  return "system";
}

const notificationCategoryIcon: Record<
  NotificationCategory,
  { icon: React.ElementType; iconClass: string; boxClass: string }
> = {
  booking: {
    icon: CalendarDays,
    iconClass: "text-[#84cc16]",
    boxClass: "bg-[#84cc16]/10 border border-[#84cc16]/25",
  },
  inbound: {
    icon: Scan,
    iconClass: "text-sky-400",
    boxClass: "bg-sky-400/10 border border-sky-500/25",
  },
  payment: {
    icon: ShieldCheck,
    iconClass: "text-emerald-400",
    boxClass: "bg-emerald-400/10 border border-emerald-500/25",
  },
  system: {
    icon: Info,
    iconClass: "text-slate-300",
    boxClass: "bg-white/[0.06] border border-slate-700/60",
  },
};

function notificationTimeAgo(dateStr: string): string {
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const diffMs = now - date;
  const seconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);

  if (seconds < 60) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  if (weeks < 4) return `${weeks}w ago`;
  return new Date(dateStr).toLocaleDateString();
}

// ─── Notification Bell + Dropdown ───────────────────────────────────────────────

function NotificationBell({ unreadCount }: { unreadCount: number }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { notifications } = useAppSelector((state) => state.notifications);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);

  // Fresh fetch (limit 4, unread first) each time the dropdown opens
  useEffect(() => {
    if (open) dispatch(fetchNotifications({ limit: 4 }));
  }, [open, dispatch]);

  // Prioritize unread, then newest — capped at 4 for the dropdown
  const items = [...notifications]
    .sort((a, b) => {
      if (a.isRead !== b.isRead) return a.isRead ? 1 : -1;
      return (
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    })
    .slice(0, 4);

  // Clicking an item only closes the dropdown and marks it as read — no navigation.
  const handleItemClick = (n: Notification) => {
    setOpen(false);
    if (!n.isRead) dispatch(markNotificationAsRead(n._id));
  };

  const handleMarkAllRead = async () => {
    await dispatch(readAllNotifications());
  };

  // Close before navigating to the notifications page
  const closeAndGo = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Notifications"
        aria-expanded={open}
        className="relative flex items-center justify-center w-9 h-9 rounded-full bg-white/[0.05] border border-[#84cc16]/20 hover:bg-[#84cc16]/10 hover:border-[#84cc16]/50 transition-all"
      >
        <Bell size={17} className="text-slate-200" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 border-2 border-[#0D0F0A] text-[9px] font-bold text-white font-body shadow-sm">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-80 md:w-96 rounded-2xl bg-[#121619] border border-slate-800/60 shadow-2xl shadow-black/60 overflow-hidden z-50"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-[#121619]">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-white font-heading">
                  Notifications
                </span>
                {unreadCount > 0 && (
                  <span className="text-[10px] font-bold text-[#84cc16] bg-[#84cc16]/10 border border-[#84cc16]/25 px-1.5 py-px rounded-full font-body">
                    {unreadCount} Unread
                  </span>
                )}
              </div>
              <button
                onClick={handleMarkAllRead}
                disabled={unreadCount === 0}
                className={`text-xs font-body font-medium transition-colors ${
                  unreadCount === 0
                    ? "text-slate-600 cursor-not-allowed"
                    : "text-[#84cc16] hover:text-[#a3e635]"
                }`}
              >
                Mark all as read
              </button>
            </div>

            {/* Content */}
            <div className="max-h-96 overflow-y-auto">
              {items.length === 0 ? (
                <div className="px-4 py-10 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-slate-800 flex items-center justify-center mx-auto mb-3">
                    <BellOff size={22} className="text-slate-600" />
                  </div>
                  <p className="text-sm font-medium text-slate-200 font-body">
                    No new notifications
                  </p>
                  <p className="text-xs text-slate-500 font-body mt-1">
                    Booking, payment, and shipment updates will appear here.
                  </p>
                </div>
              ) : (
                <div className="py-1.5">
                  {items.map((n) => {
                    const cat = notificationCategory(n);
                    const cfg = notificationCategoryIcon[cat];
                    const Icon = cfg.icon;
                    return (
                      <button
                        key={n._id}
                        onClick={() => handleItemClick(n)}
                        className={`w-full text-left flex items-start gap-3 px-4 py-3 transition-colors ${
                          !n.isRead
                            ? "bg-white/[0.04] hover:bg-white/[0.06]"
                            : "hover:bg-white/[0.03]"
                        }`}
                      >
                        <span
                          className={`shrink-0 w-8 h-8 rounded-xl flex items-center justify-center ${cfg.boxClass}`}
                        >
                          <Icon size={14} className={cfg.iconClass} />
                        </span>
                        <span className="flex-1 min-w-0">
                          <span className="flex items-center gap-2">
                            <span
                              className={`text-[13px] font-semibold font-body truncate ${
                                n.isRead ? "text-slate-300" : "text-white"
                              }`}
                            >
                              {n.title || cat}
                            </span>
                            {!n.isRead && (
                              <span className="shrink-0 w-2 h-2 rounded-full bg-[#84cc16] shadow-[0_0_8px_rgba(132,204,22,0.9)]" />
                            )}
                          </span>
                          <span className="block text-xs text-slate-400 font-body truncate mt-0.5">
                            {n.message}
                          </span>
                          <span className="block text-[10px] text-slate-500 font-body mt-1">
                            {notificationTimeAgo(n.createdAt)}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <button
              onClick={() => closeAndGo("/notifications")}
              className="w-full flex items-center justify-center gap-1.5 px-4 py-3 text-sm font-medium text-[#84cc16] hover:text-[#a3e635] hover:bg-[#84cc16]/5 border-t border-slate-800 font-body transition-colors"
            >
              View all notifications
              <ChevronRight size={15} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Desktop Nav Link ───────────────────────────────────────────────────────────

function NavLink({
  href,
  label,
  onClick,
  active,
}: {
  href: string;
  label: string;
  onClick?: () => void;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`px-4 py-1.5 text-sm font-body transition-colors rounded-full ${
        active
          ? "text-[#84cc16] bg-neutral-800 font-medium border border-[#84cc16]/20"
          : "text-slate-300/80 hover:text-[#84cc16] hover:bg-[#84cc16]/10"
      }`}
    >
      {label}
    </Link>
  );
}

// ─── User Avatar Dropdown ───────────────────────────────────────────────────────

function UserDropdown({
  userName,
  userRole,
  isAdmin,
  onLogout,
}: {
  userName: string;
  userRole: string;
  isAdmin: boolean;
  onLogout: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter()

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const initials = userName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.05] border border-[#84cc16]/20 hover:bg-[#84cc16]/10 hover:border-[#84cc16]/50 transition-all"
      >
        <div className="w-7 h-7 rounded-full bg-[#1a231d] border border-[#84cc16]/30 flex items-center justify-center">
          <span className="text-[11px] font-semibold text-[#84cc16] font-body">
            {initials || "U"}
          </span>
        </div>
        <ChevronDown
          size={14}
          className={`text-slate-300 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-56 rounded-2xl bg-[#12150E]/95 border border-[#84cc16]/20 shadow-2xl shadow-black/60 backdrop-blur-xl overflow-hidden"
          >
            <div className="p-3 border-b border-[#84cc16]/15">
              <p className="text-sm font-semibold text-white font-body truncate">
                {userName}
              </p>
              <p className="text-[11px] text-slate-400 font-body capitalize">
                {userRole === "warehouseOwner"
                  ? "Warehouse Owner"
                  : userRole === "merchant"
                  ? "Merchant"
                  : userRole === "worker"
                  ? "Worker"
                  : userRole}
              </p>
            </div>

            <div className="p-1.5">
              <Link
                href="/profile"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-slate-300 hover:text-[#84cc16] hover:bg-[#84cc16]/10 transition-colors font-body"
              >
                <User size={16} />
                Profile
              </Link>
              
              {(userRole === "warehouseOwner") && (
                <Link
                  href="/dashboard"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-semibold text-[#84cc16] hover:text-[#84cc16] hover:bg-[#84cc16]/15 transition-colors font-body"
                >
                  <LayoutDashboard size={16} />
                  Dashboard
                </Link>
              )}
              {userRole === "merchant" && (
                <>
                <Link
                href="/explore"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-slate-300 hover:text-[#84cc16] hover:bg-[#84cc16]/10 transition-colors font-body"
              >
                <Compass size={16} />
                Explore Warehouses
              </Link>
                <Link
                  href="/merchant-dashboard"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-semibold text-[#84cc16] hover:text-[#84cc16] hover:bg-[#84cc16]/15 transition-colors font-body"
                >
                  <LayoutDashboard size={16} />
                  Dashboard
                </Link>
                </>
              )}
              
              {(isAdmin || userRole === "admin") && (
                <>
                  <Link
                    href="/admin/verifications"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-[#84cc16] hover:text-[#84cc16] hover:bg-[#84cc16]/15 transition-colors font-body"
                  >
                    <ShieldCheck size={16} />
                    Verify Users
                  </Link>
                  <Link
                    href="/admin/contacts"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-[#84cc16] hover:text-[#84cc16] hover:bg-[#84cc16]/15 transition-colors font-body"
                  >
                    <MessageCircle size={16} />
                    Contact Messages
                  </Link>
                </>
              )}

              <hr className="my-1 border-[#84cc16]/15" />

              <button
                onClick={() => {
                  setOpen(false);
                  onLogout();
                  router.push("/login")
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors font-body"
              >
                <LogOut size={16} />
                Sign Out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// NAVBAR
// ═══════════════════════════════════════════════════════════════════════════════

const Navbar: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const { accessToken, user, isCheckingAuth } = useAppSelector(
    (state) => state.auth
  );

  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // ─── Body scroll lock while the mobile menu is open ────────────────────
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const isLoggedIn = !!accessToken;
  const role = user?.role || "";

  // ─── Notification state ────────────────────────────────────────────────
  const { unread } = useAppSelector((state) => state.notifications);

  // Fetch notifications on mount and periodically when logged in
  useEffect(() => {
    if (!isLoggedIn) return;
    dispatch(fetchNotifications());
    const interval = setInterval(() => {
      dispatch(fetchNotifications());
    }, 30000); // Poll every 30 seconds
    return () => clearInterval(interval);
  }, [isLoggedIn, dispatch]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleLogout = () => {
    dispatch(logoutAction());
    if (typeof window !== "undefined") {
      localStorage.removeItem("byteshelf_access_token");
      localStorage.removeItem("auth_tokens");
    }
    setIsOpen(false);
    router.push("/");
  };

  // ─── Guest links ─────────────────────────────────────────────────────────
  const guestLinks: { href: string; label: string; icon: React.ElementType }[] = [
    { href: "/", label: "Home", icon: House },
    { href: "/explore", label: "Explore Warehouses", icon: Compass },
    { href: "/how-it-works", label: "How It Works", icon: Info },
    { href: "/blog", label: "Blog", icon: Newspaper },
    { href: "/help", label: "Help", icon: LifeBuoy },
    { href: "/contact", label: "Contact", icon: Mail },
  ];

  // ─── Authenticated links (common, filtered by role) ─────────────────────
  const isOwner = role === "warehouseOwner";
  const isMerchant = role === "merchant";
  const authLinks: { href: string; label: string; icon: React.ElementType }[] = [
     { href: "/", label: "Home", icon: House },
     { href: "/about", label: "About", icon: Info },
     { href: "/how-it-works", label: "How It Works", icon: Info },
     { href: "/blog", label: "Blog", icon: Newspaper },
     { href: "/help", label: "Help", icon: LifeBuoy },
     { href: "/contact", label: "Contact", icon: Mail },
  ];

  // ─── Role-specific nav links (only what's NOT in dropdown) ───────────────
  // Merchants get ONLY Home, About, How It Works, Help, Contact in top nav.
  // Explore and My Bookings are accessed from their dashboard.

  const roleLinks: { href: string; label: string; icon?: React.ElementType }[] = [];
  if (role === "worker") {
    roleLinks.push(
      { href: "/my-bookings", label: "My Bookings", icon: CalendarDays }
    );
  }

  // Worker-only links
  const workerLinks: { href: string; label: string }[] = [];
  if (role === "worker") {
    workerLinks.push(
      { href: "/worker/scan", label: "Scan Cartons" }
    );
  }

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };
  const isDashboardActive =
    pathname.startsWith("/dashboard") || pathname.startsWith("/merchant-dashboard");
  const isNotificationsActive = pathname.startsWith("/notifications");
  const isProfileActive = pathname.startsWith("/profile");

  // Shared mobile link classes — active mirrors the desktop theme
  const mobileLinkCls = (active: boolean) =>
    `flex items-center gap-2.5 px-4 py-2.5 text-sm font-body rounded-xl transition-colors ${
      active
        ? "bg-neutral-800 text-[#84cc16] border-l-2 border-[#84cc16] font-medium"
        : "text-neutral-400 hover:text-white hover:bg-white/5"
    }`;

  // ─── Show nothing while checking auth (prevent flash) ────────────────────
  if (isCheckingAuth) {
    return (
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center px-4 pt-4">
        <div className="w-full max-w-6xl mx-auto px-6 py-3.5 flex items-center justify-between rounded-full bg-[#0D0F0A]/80 border border-[#84cc16]/20 backdrop-blur-md">
          <Link href="/" className="flex items-center group">
            <Image src="/logo.png" alt="ByteShelf Logo" width={40} height={40} className="object-contain" />
            <span className="font-heading text-lg font-semibold text-white tracking-tight">
              ByteShelf
            </span>
          </Link>
        </div>
      </nav>
    );
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center px-4 pt-4">
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className={`w-full max-w-6xl mx-auto px-6 py-3.5 flex items-center justify-between rounded-full transition-all duration-300 bg-[#0D0F0A]/80 backdrop-blur-md border border-[#84cc16]/20 ${
          scrolled
            ? "shadow-lg shadow-black/40"
            : "shadow-md shadow-black/40"
        }`}
      >
        {/* Logo */}
        <Link href="/" className="flex items-center group">
          <Image
            src="/logo.png"
            alt="ByteShelf Logo"
            width={40}
            height={40}
            priority
            className="object-contain transition-[filter] duration-300 group-hover:drop-shadow-[0_0_12px_rgba(132,204,22,0.5)]"
          />
          <span className="font-heading text-lg font-semibold text-white tracking-tight">
            ByteShelf
          </span>
        </Link>

        {/* Desktop Nav */}
        {isLoggedIn ? (
          <div className="hidden md:flex items-center gap-1">
            {authLinks.map((link) => (
              <NavLink key={`auth-${link.href}`} href={link.href} label={link.label} active={isActive(link.href)} />
            ))}
            {roleLinks.map((link) => (
              <NavLink key={`role-${link.href}`} href={link.href} label={link.label} active={isActive(link.href)} />
            ))}
            {workerLinks.map((link) => (
              <NavLink key={`worker-${link.href}`} href={link.href} label={link.label} active={isActive(link.href)} />
            ))}
          </div>
        ) : (
          <div className="hidden md:flex items-center gap-1">
            {guestLinks.map((link) => (
              <NavLink key={link.href} href={link.href} label={link.label} active={isActive(link.href)} />
            ))}
          </div>
        )}

        {/* Desktop Auth CTAs - Hide Sign In/Join Free when logged in */}
        <div className="hidden md:flex items-center gap-3">
          {isLoggedIn ? (
            <>
              <NotificationBell unreadCount={unread} />
              <UserDropdown
                userName={user?.name || "User"}
                userRole={role}
                isAdmin={!!user?.isAdmin}
                onLogout={handleLogout}
              />
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-body text-slate-300 hover:text-[#84cc16] transition-colors rounded-full hover:bg-[#84cc16]/10"
              >
                <LogIn size={15} />
                Sign In
              </Link>
              <Link
                href="/signup"
                className="px-5 py-2 text-sm font-body font-semibold bg-[#1a231d] text-[#84cc16] border border-[#84cc16]/40 rounded-full hover:bg-[#222e26] hover:border-[#84cc16]/60 active:scale-95 transition-all duration-200"
              >
                Create Account
              </Link>
            </>
          )}
        </div>

        {/* Mobile menu button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="md:hidden p-2 rounded-full text-slate-300 hover:text-[#84cc16] hover:bg-[#84cc16]/10 transition-colors"
          aria-label={isOpen ? "Close menu" : "Open menu"}
        >
          {isOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </motion.div>

      {/* Mobile Nav */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-4 right-4 mt-3 rounded-2xl bg-neutral-900/95 border border-[#84cc16]/20 shadow-2xl shadow-black/60 backdrop-blur-md overflow-hidden md:hidden z-50"
          >
            <div className="p-3 space-y-1">
              {isLoggedIn ? (
                <>
                  {user && (
                    <div className="flex items-center gap-3 px-4 py-3 mb-1 rounded-xl bg-white/[0.04] border border-[#84cc16]/10">
                      <div className="w-8 h-8 rounded-full bg-[#1a231d] border border-[#84cc16]/30 flex items-center justify-center">
                        <span className="text-xs font-semibold text-[#84cc16] font-body">
                          {user.name
                            ?.split(" ")
                            .map((w) => w[0])
                            .join("")
                            .toUpperCase()
                            .slice(0, 2) || "U"}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-white font-body truncate">
                          {user.name}
                        </p>
                        <p className="text-[11px] text-slate-400 font-body capitalize">
                          {role === "warehouseOwner"
                            ? "Warehouse Owner"
                            : role === "merchant"
                            ? "Merchant"
                            : role}
                        </p>
                      </div>
                    </div>
                  )}

                  <Link
                    href="/notifications"
                    onClick={() => setIsOpen(false)}
                    className={mobileLinkCls(isNotificationsActive)}
                  >
                    <span className="relative">
                      <Bell size={16} className={isNotificationsActive ? "text-[#84cc16]" : "text-neutral-400"} />
                      {unread > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 flex items-center justify-center min-w-[16px] h-[16px] px-1 rounded-full bg-red-500 text-[8px] font-bold text-white font-body">
                          {unread > 99 ? "99+" : unread}
                        </span>
                      )}
                    </span>
                    Notifications
                  </Link>

                  {authLinks.map((link) => {
                    const Icon = link.icon;
                    const active = isActive(link.href);
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={() => setIsOpen(false)}
                        className={mobileLinkCls(active)}
                      >
                        {Icon && <Icon size={16} className={active ? "text-[#84cc16]" : "text-neutral-400"} />}
                        {link.label}
                      </Link>
                    );
                  })}

                  <hr className="my-2 border-white/10" />

                  <Link
                    href="/profile"
                    onClick={() => setIsOpen(false)}
                    className={mobileLinkCls(isProfileActive)}
                  >
                    <User size={16} className={isProfileActive ? "text-[#84cc16]" : "text-neutral-400"} />
                    Profile
                  </Link>

                  {(isOwner || isMerchant) && (
                    <Link
                      href={isMerchant ? "/merchant-dashboard" : "/dashboard"}
                      onClick={() => setIsOpen(false)}
                      className={mobileLinkCls(isDashboardActive)}
                    >
                      <LayoutDashboard size={16} className={isDashboardActive ? "text-[#84cc16]" : "text-neutral-400"} />
                      Dashboard
                    </Link>
                  )}

                  {isMerchant && (
                    <Link
                      href="/explore"
                      onClick={() => setIsOpen(false)}
                      className={mobileLinkCls(isActive("/explore"))}
                    >
                      <Compass size={16} className={isActive("/explore") ? "text-[#84cc16]" : "text-neutral-400"} />
                      Explore Warehouses
                    </Link>
                  )}

                  {role === "worker" && (
                    <Link
                      href="/my-bookings"
                      onClick={() => setIsOpen(false)}
                      className={mobileLinkCls(isActive("/my-bookings"))}
                    >
                      <CalendarDays size={16} className={isActive("/my-bookings") ? "text-[#84cc16]" : "text-neutral-400"} />
                      My Bookings
                    </Link>
                  )}

                  {role === "worker" && (
                    <Link
                      href="/worker/scan"
                      onClick={() => setIsOpen(false)}
                      className={mobileLinkCls(isActive("/worker/scan"))}
                    >
                      <Scan size={16} className={isActive("/worker/scan") ? "text-[#84cc16]" : "text-neutral-400"} />
                      Scan Cartons
                    </Link>
                  )}

                  {(user?.isAdmin || role === "admin") && (
                    <>
                      <Link
                        href="/admin/verifications"
                        onClick={() => setIsOpen(false)}
                        className={mobileLinkCls(isActive("/admin/verifications"))}
                      >
                        <ShieldCheck size={16} className={isActive("/admin/verifications") ? "text-[#84cc16]" : "text-neutral-400"} />
                        Verify Users
                      </Link>
                      <Link
                        href="/admin/contacts"
                        onClick={() => setIsOpen(false)}
                        className={mobileLinkCls(isActive("/admin/contacts"))}
                      >
                        <MessageCircle size={16} className={isActive("/admin/contacts") ? "text-[#84cc16]" : "text-neutral-400"} />
                        Contact Messages
                      </Link>
                    </>
                  )}

                  <hr className="my-2 border-white/10" />
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      handleLogout();
                    }}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-body text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-colors w-full text-left"
                  >
                    <LogOut size={16} />
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  {guestLinks.map((link) => {
                    const Icon = link.icon;
                    const active = isActive(link.href);
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={() => setIsOpen(false)}
                        className={mobileLinkCls(active)}
                      >
                        {Icon && <Icon size={16} className={active ? "text-[#84cc16]" : "text-neutral-400"} />}
                        {link.label}
                      </Link>
                    );
                  })}
                  <hr className="my-2 border-white/10" />
                  <Link
                    href="/login"
                    onClick={() => setIsOpen(false)}
                    className={mobileLinkCls(false)}
                  >
                    <LogIn size={16} className="text-neutral-400" />
                    Sign In
                  </Link>
                  <Link
                    href="/signup"
                    onClick={() => setIsOpen(false)}
                    className="block px-4 py-2.5 text-sm font-body font-semibold bg-[#1a231d] text-[#84cc16] border border-[#84cc16]/40 text-center rounded-xl hover:bg-[#222e26] hover:border-[#84cc16]/60 transition-colors"
                  >
                    Create Account
                  </Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
