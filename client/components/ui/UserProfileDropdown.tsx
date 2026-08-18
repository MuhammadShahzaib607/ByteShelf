"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Compass, House, LayoutDashboard, LogOut, User, Warehouse } from "lucide-react";
import type { ElementType } from "react";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { logout } from "@/redux/slices/authSlice";

// ─── Types ──────────────────────────────────────────────────────────────────────

interface ProfileLink {
  label: string;
  icon: ElementType;
  href: string;
}

// ─── Helpers ────────────────────────────────────────────────────────────────────

function roleLabel(role: string | null | undefined, isAdmin: boolean): string {
  if (isAdmin) return "Admin";
  if (role === "warehouseOwner") return "Warehouse Owner";
  if (role === "merchant") return "Merchant";
  if (role === "worker") return "Worker";
  return role ? role.charAt(0).toUpperCase() + role.slice(1) : "Member";
}

// ─── User Profile Dropdown ──────────────────────────────────────────────────────
// Standardized menu (same on the home navbar and both dashboards):
//   Merchants:        Profile, Explore Warehouses, [Dashboard|Home], Sign Out
//   Owners / Admins:  Profile, My Warehouses, [Dashboard|Home], Sign Out
// The primary nav item is context-aware: on the main site it shows "Dashboard"
// (jump back into the app), inside a dashboard it shows "Home" (back to the
// landing page). No internal dashboard sidebar links are listed here.

export default function UserProfileDropdown({
  showName = true,
  triggerClassName = "hidden md:flex bg-white/10 border border-white/10 hover:bg-white/20",
  avatarClassName = "bg-[#84cc16]",
  initialsClassName = "text-black",
}: {
  /** Whether the trigger shows the user's name (hidden in compact/navbar mode). */
  showName?: boolean;
  /** Full pill styling for the trigger (visibility + colors). */
  triggerClassName?: string;
  /** Avatar badge classes (customizable to match the host header's theme). */
  avatarClassName?: string;
  /** Initials text classes. */
  initialsClassName?: string;
}) {
  const { user } = useAppSelector((s) => s.auth);
  const dispatch = useAppDispatch();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const initials =
    user?.name
      ?.split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "U";
  const isAdmin = !!(user?.isAdmin || user?.role === "admin");
  const isMerchant = user?.role === "merchant";
  const isOwner = user?.role === "warehouseOwner";

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

  const handleSignOut = () => {
    setOpen(false);
    dispatch(logout());
    if (typeof window !== "undefined") {
      localStorage.removeItem("byteshelf_access_token");
      localStorage.removeItem("auth_tokens");
    }
    router.push("/login");
  };

  // Context-aware primary item: inside a dashboard → "Home" (back to landing),
  // on the main site → "Dashboard" (back into the app).
  const isInsideDashboard =
    !!pathname &&
    (pathname.startsWith("/dashboard") || pathname.startsWith("/merchant-dashboard"));
  const dashboardHref = isMerchant ? "/merchant-dashboard" : "/dashboard";
  const primaryLink: ProfileLink = isInsideDashboard
    ? { label: "Home", icon: House, href: "/" }
    : { label: "Dashboard", icon: LayoutDashboard, href: dashboardHref };

  // Standardized role-based links — Profile, role destination, Dashboard/Home.
  const links: ProfileLink[] = [
    { label: "Profile", icon: User, href: "/profile" },
    ...(isMerchant ? [{ label: "Explore Warehouses", icon: Compass, href: "/explore" }] : []),
    ...(isOwner || isAdmin ? [{ label: "My Warehouses", icon: Warehouse, href: "/warehouses" }] : []),
    primaryLink,
  ];

  return (
    <div className="relative" ref={ref}>
      {/* Trigger pill — avatar + (optional) name */}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Account menu"
        aria-expanded={open}
        className={`items-center gap-2 px-3 py-1.5 rounded-full transition-all ${triggerClassName}`}
      >
        <div className={`w-7 h-7 rounded-full flex items-center justify-center ${avatarClassName}`}>
          <span className={`text-[11px] font-semibold font-body ${initialsClassName}`}>{initials}</span>
        </div>
        {showName && (
          <span className="text-sm font-medium text-white font-body hidden sm:block">{user?.name || "User"}</span>
        )}
        <ChevronDown
          size={14}
          className={`text-neutral-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-64 rounded-2xl bg-[#0e130e] border border-[#1f291f] shadow-2xl shadow-black/60 overflow-hidden z-50"
          >
            {/* Header — identity + role badge */}
            <div className="px-4 py-3.5 border-b border-[#1f291f] bg-[#111611]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#84cc16] flex items-center justify-center shrink-0">
                  <span className="text-xs font-bold text-black font-body">{initials}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-white font-body truncate">{user?.name || "User"}</p>
                  <p className="text-[11px] text-slate-400 font-body truncate">{user?.email || "—"}</p>
                </div>
              </div>
              <span className="mt-2.5 inline-flex items-center px-2 py-0.5 rounded-full bg-[#84cc16]/10 border border-[#84cc16]/25 text-[10px] font-semibold uppercase tracking-wider text-[#84cc16] font-body">
                {roleLabel(user?.role, isAdmin)}
              </span>
            </div>

            {/* Navigation links */}
            <div className="p-1.5">
              {links.map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.label}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-left text-slate-300 hover:text-[#84cc16] hover:bg-[#182218] transition-colors font-body"
                  >
                    <Icon size={16} className="shrink-0" />
                    <span className="truncate">{link.label}</span>
                  </Link>
                );
              })}
            </div>

            {/* Footer — sign out */}
            <div className="p-1.5 border-t border-[#1f291f]">
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-left text-red-400 hover:bg-red-950/30 hover:text-red-300 transition-colors font-body"
              >
                <LogOut size={16} className="shrink-0" />
                Sign Out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
