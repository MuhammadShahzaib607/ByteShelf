"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  Menu,
  X,
  User,
  LogIn,
  LogOut,
  Warehouse,
  Plus,
  Compass,
  ChevronDown,
  PackageSearch,
  CalendarDays,
  Info,
  Mail,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { logout as logoutAction } from "@/redux/slices/authSlice";

// ─── Desktop Nav Link ───────────────────────────────────────────────────────────

function NavLink({
  href,
  label,
  onClick,
}: {
  href: string;
  label: string;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="px-4 py-1.5 text-sm font-body text-[#0F172A]/60 hover:text-[#0F172A] transition-colors rounded-full hover:bg-[#F8FAFC]/40"
    >
      {label}
    </Link>
  );
}

// ─── User Avatar Dropdown ───────────────────────────────────────────────────────

function UserDropdown({
  userName,
  userRole,
  onLogout,
}: {
  userName: string;
  userRole: string;
  onLogout: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

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
        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#F8FAFC]/60 border border-[#0284C7]/15 hover:bg-[#F8FAFC] transition-colors"
      >
        <div className="w-7 h-7 rounded-full bg-[#1E293B] flex items-center justify-center">
          <span className="text-[11px] font-semibold text-white font-body">
            {initials || "U"}
          </span>
        </div>
        <ChevronDown
          size={14}
          className={`text-[#0F172A]/50 transition-transform duration-200 ${
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
            className="absolute right-0 top-full mt-2 w-56 rounded-2xl bg-white border border-[#0284C7]/10 shadow-xl shadow-slate-900/10 overflow-hidden"
          >
            <div className="p-3 border-b border-[#0284C7]/10">
              <p className="text-sm font-semibold text-[#1E293B] font-body truncate">
                {userName}
              </p>
              <p className="text-[11px] text-[#0F172A]/50 font-body capitalize">
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
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-[#0F172A]/70 hover:text-[#0F172A] hover:bg-[#F8FAFC]/40 transition-colors font-body"
              >
                <User size={16} />
                Profile
              </Link>
              <Link
                href="/explore"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-[#0F172A]/70 hover:text-[#0F172A] hover:bg-[#F8FAFC]/40 transition-colors font-body"
              >
                <Compass size={16} />
                Explore Warehouses
              </Link>

              <hr className="my-1 border-[#0284C7]/10" />

              <button
                onClick={() => {
                  setOpen(false);
                  onLogout();
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-red-600 hover:bg-red-50 transition-colors font-body"
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
  const dispatch = useAppDispatch();
  const { accessToken, user, isCheckingAuth } = useAppSelector(
    (state) => state.auth
  );

  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const isLoggedIn = !!accessToken;
  const role = user?.role || "";

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
  const guestLinks = [
    { href: "/", label: "Home" },
    { href: "/explore", label: "Explore" },
    { href: "/about", label: "About" },
    { href: "/contact", label: "Contact" },
    { href: "#how-it-works", label: "How it Works" },
    { href: "#pricing", label: "Pricing" },
  ];

  // ─── Authenticated links (common) ────────────────────────────────────────
  const authLinks = [
    { href: "/explore", label: "Explore Warehouses", icon: Compass },
    { href: "/about", label: "About", icon: Info },
    { href: "/contact", label: "Contact", icon: Mail },
    { href: "/profile", label: "Profile", icon: User },
  ];

  // ─── Role-specific links ─────────────────────────────────────────────────
  const roleLinks: { href: string; label: string }[] = [];
  if (role === "warehouseOwner") {
    roleLinks.push(
      { href: "/warehouses", label: "My Warehouses" },
      { href: "/warehouses/add", label: "+ Add Warehouse" }
    );
  } else if (role === "merchant" || role === "worker") {
    roleLinks.push(
      { href: "/my-bookings", label: "My Bookings" }
    );
  }

  // ─── Show nothing while checking auth (prevent flash) ────────────────────
  if (isCheckingAuth) {
    return (
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center px-4 pt-4">
        <div className="w-full max-w-6xl mx-auto px-6 py-3.5 flex items-center justify-between rounded-full bg-white/80 backdrop-blur-md border border-[#0284C7]/10 shadow-sm shadow-slate-900/10">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-[#1E293B] flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
              </svg>
            </div>
            <span className="font-heading text-lg font-semibold text-[#1E293B] tracking-tight">
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
        className={`w-full max-w-6xl mx-auto px-6 py-3.5 flex items-center justify-between rounded-full transition-all duration-300 ${
          scrolled
            ? "bg-white/90 backdrop-blur-xl border border-[#0284C7]/10 shadow-lg shadow-slate-900/10"
            : "bg-white/80 backdrop-blur-md border border-[#0284C7]/10 shadow-sm shadow-slate-900/10"
        }`}
      >
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-[#1E293B] flex items-center justify-center group-hover:bg-[#0284C7] transition-colors duration-300">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
          </div>
          <span className="font-heading text-lg font-semibold text-[#1E293B] tracking-tight">
            ByteShelf
          </span>
        </Link>

        {/* Desktop Nav */}
        {isLoggedIn ? (
          <div className="hidden md:flex items-center gap-1">
            {authLinks.map((link) => (
              <NavLink key={`auth-${link.href}`} href={link.href} label={link.label} />
            ))}
            {roleLinks.map((link) => (
              <NavLink key={`role-${link.href}`} href={link.href} label={link.label} />
            ))}
          </div>
        ) : (
          <div className="hidden md:flex items-center gap-1">
            {guestLinks.map((link) => (
              <NavLink key={link.href} href={link.href} label={link.label} />
            ))}
          </div>
        )}

        {/* Desktop Auth CTAs - Hide Sign In/Join Free when logged in */}
        <div className="hidden md:flex items-center gap-3">
          {isLoggedIn ? (
            <UserDropdown
              userName={user?.name || "User"}
              userRole={role}
              onLogout={handleLogout}
            />
          ) : (
            <>
              <Link
                href="/login"
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-body text-[#0F172A]/70 hover:text-[#0F172A] transition-colors rounded-full hover:bg-[#F8FAFC]/40"
              >
                <LogIn size={15} />
                Sign In
              </Link>
              <Link
                href="/signup"
                className="px-5 py-2 text-sm font-body font-medium bg-[#1E293B] text-white rounded-full hover:bg-[#0284C7] transition-all duration-300 shadow-sm shadow-slate-900/10 hover:shadow-md"
              >
                Join Free
              </Link>
            </>
          )}
        </div>

        {/* Mobile menu button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="md:hidden p-2 rounded-full text-[#0F172A]/60 hover:bg-[#F8FAFC]/40 transition-colors"
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
            className="absolute top-full left-4 right-4 mt-3 rounded-2xl bg-white/95 backdrop-blur-xl border border-[#0284C7]/10 shadow-lg shadow-slate-900/10 overflow-hidden md:hidden"
          >
            <div className="p-3 space-y-1">
              {isLoggedIn ? (
                <>
                  {user && (
                    <div className="flex items-center gap-3 px-4 py-3 mb-1 rounded-xl bg-[#F8FAFC]/40">
                      <div className="w-8 h-8 rounded-full bg-[#1E293B] flex items-center justify-center">
                        <span className="text-xs font-semibold text-white font-body">
                          {user.name
                            ?.split(" ")
                            .map((w) => w[0])
                            .join("")
                            .toUpperCase()
                            .slice(0, 2) || "U"}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[#1E293B] font-body truncate">
                          {user.name}
                        </p>
                        <p className="text-[11px] text-[#0F172A]/50 font-body capitalize">
                          {role === "warehouseOwner"
                            ? "Warehouse Owner"
                            : role === "merchant"
                            ? "Merchant"
                            : role}
                        </p>
                      </div>
                    </div>
                  )}

                  {authLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setIsOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-body text-[#0F172A]/60 hover:text-[#0F172A] hover:bg-[#F8FAFC]/40 rounded-xl transition-colors"
                    >
                      <link.icon size={16} />
                      {link.label}
                    </Link>
                  ))}

                  {role === "warehouseOwner" && (
                    <>
                      <Link
                        href="/warehouses"
                        onClick={() => setIsOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-body text-[#0F172A]/60 hover:text-[#0F172A] hover:bg-[#F8FAFC]/40 rounded-xl transition-colors"
                      >
                        <Warehouse size={16} />
                        My Warehouses
                      </Link>
                      <Link
                        href="/warehouses/add"
                        onClick={() => setIsOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-body text-[#0F172A]/60 hover:text-[#0F172A] hover:bg-[#F8FAFC]/40 rounded-xl transition-colors"
                      >
                        <Plus size={16} />
                        Add Warehouse
                      </Link>
                    </>
                  )}
                  {(role === "merchant" || role === "worker") && (
                    <Link
                      href="/my-bookings"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-body text-[#0F172A]/60 hover:text-[#0F172A] hover:bg-[#F8FAFC]/40 rounded-xl transition-colors"
                    >
                      <CalendarDays size={16} />
                      My Bookings
                    </Link>
                  )}

                  <hr className="my-2 border-[#0284C7]/10" />
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      handleLogout();
                    }}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-body text-red-600 hover:bg-red-50 rounded-xl transition-colors w-full text-left"
                  >
                    <LogOut size={16} />
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  {guestLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setIsOpen(false)}
                      className="block px-4 py-2.5 text-sm font-body text-[#0F172A]/60 hover:text-[#0F172A] hover:bg-[#F8FAFC]/40 rounded-xl transition-colors"
                    >
                      {link.label}
                    </Link>
                  ))}
                  <hr className="my-2 border-[#0284C7]/10" />
                  <Link
                    href="/login"
                    onClick={() => setIsOpen(false)}
                    className="block px-4 py-2.5 text-sm font-body text-[#0F172A]/60 hover:text-[#0F172A] hover:bg-[#F8FAFC]/40 rounded-xl transition-colors"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/signup"
                    onClick={() => setIsOpen(false)}
                    className="block px-4 py-2.5 text-sm font-body font-medium bg-[#1E293B] text-white text-center rounded-xl hover:bg-[#0284C7] transition-colors"
                  >
                    Join Free
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
