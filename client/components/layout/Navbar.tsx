"use client";

import { useState, useEffect } from "react";
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
  CalendarDays,
  Info,
  Mail,
  Bell,
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
import { fetchNotifications } from "@/redux/slices/notificationSlice";
import NotificationBell from "@/components/ui/NotificationBell";
import UserProfileDropdown from "@/components/ui/UserProfileDropdown";

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

// ─── User Avatar Dropdown (shared component) ────────────────────────────────────

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
  if (isCheckingAuth && !user) {
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
              <UserProfileDropdown
                showName={false}
                triggerClassName="flex bg-white/[0.05] border border-[#84cc16]/20 hover:bg-[#84cc16]/10 hover:border-[#84cc16]/50"
                avatarClassName="bg-[#1a231d] border border-[#84cc16]/30"
                initialsClassName="text-[#84cc16]"
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
              {isCheckingAuth && !user ? (
                    <div className="flex items-center gap-3 px-4 py-3 mb-1 rounded-xl bg-white/[0.04] border border-[#84cc16]/10">
                      <div className="w-8 h-8 rounded-full bg-[#1a231d] border border-[#84cc16]/30 animate-pulse" />
                      <div className="min-w-0 flex-1">
                        <div className="h-3.5 w-20 rounded bg-white/10 animate-pulse" />
                        <div className="h-2.5 w-14 rounded bg-white/5 animate-pulse mt-1.5" />
                      </div>
                    </div>
                  ) : user && (
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