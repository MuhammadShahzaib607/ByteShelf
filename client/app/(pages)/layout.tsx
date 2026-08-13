"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Loader2, LogOut, Clock, ArrowLeft } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { logout } from "@/redux/slices/authSlice";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import FloatingChatButton from "@/components/ui/FloatingChatButton";
import AuthRequiredModal from "@/components/ui/AuthRequiredModal";
import DashboardLayout from "./dashboard/layout";

// ─── Public routes ─────────────────────────────────────────────────────────────
// Guests can freely view these without signing in — no redirect, no modal.
const PUBLIC_PATHS = [
  "/",
  "/login",
  "/signup",
  "/verify-otp",
  "/about",
  "/blog",
  "/contact",
  "/help",
  "/how-it-works",
  "/terms",
  "/privacy-policy",
  "/cookie-policy",
];

const isPublicPath = (pathname: string) =>
  PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));

// Guest-mode flag: persisted so "Continue browsing as guest" smoothly returns
// the user to the public landing page instead of re-prompting on every visit.
const GUEST_MODE_KEY = "byteshelf_guest_mode";

export default function PagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const { accessToken, user, isCheckingAuth } = useAppSelector((state) => state.auth);

  const isLoggedIn = !!accessToken;
  const isGuest = !isLoggedIn;
  const isPublic = isPublicPath(pathname);

  const [guestMode, setGuestMode] = useState(false);

  // ─── Guest-mode flag: hydrate from storage, clear once signed in ────────
  useEffect(() => {
    if (typeof window === "undefined") return;
    const t = setTimeout(() => {
      if (isLoggedIn) {
        localStorage.removeItem(GUEST_MODE_KEY);
        setGuestMode(false);
      } else {
        setGuestMode(localStorage.getItem(GUEST_MODE_KEY) === "1");
      }
    }, 0);
    return () => clearTimeout(t);
  }, [isLoggedIn]);

  // ─── Guest (persisted mode) on a protected route → safe redirect home ───
  const needsAuthModal = !isCheckingAuth && isGuest && !isPublic;
  useEffect(() => {
    if (needsAuthModal && guestMode) {
      router.replace("/");
    }
  }, [needsAuthModal, guestMode, router]);

  const handleContinueAsGuest = () => {
    try {
      localStorage.setItem(GUEST_MODE_KEY, "1");
    } catch {
      /* storage unavailable — fall through */
    }
    setGuestMode(true);
    router.replace("/");
  };

  // ─── Detect dashboard routes (render sidebar layout instead of public Navbar/Footer) ─
  const isDashboard = pathname.startsWith("/dashboard");
  const isMerchantDashboard = pathname.startsWith("/merchant-dashboard");

  // ─── Detect if we should show a stripped-down layout (pending user on /messages) ─
  const isPendingOnChat =
    !!user && !!accessToken && user.verificationStatus === "pending" && pathname === "/messages";

  // ─── Show loading spinner while checking auth (skip public routes to avoid flicker) ─
  if (isCheckingAuth && !isPublic) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#0D0F0A]">
        <Loader2 size={32} className="animate-spin text-[#D0F219]" />
      </div>
    );
  }

  // ─── Unauthenticated guest on a protected route — intercept with the
  //      "Sign in Required" modal overlay. Children are withheld so page-level
  //      auth effects / API calls can't fire and bounce the guest to /login. ──
  if (needsAuthModal) {
    return (
      <div className="min-h-screen flex flex-col bg-[#0D0F0A]">
        <Navbar />
        <main className="flex-1" />
        <Footer />
        <AuthRequiredModal
          open
          onClose={handleContinueAsGuest}
          onContinueAsGuest={handleContinueAsGuest}
        />
      </div>
    );
  }

  // ─── Dashboard/merchant-dashboard routes — render sidebar layout without public Navbar/Footer ─
  if (isDashboard || isMerchantDashboard) {
    return <DashboardLayout>{children}</DashboardLayout>;
  }

  // ─── Pending user on /messages — stripped layout (no Navbar/Footer/ChatButton) ─
  if (isPendingOnChat) {
    return (
      <div className="min-h-screen flex flex-col bg-[#0D0F0A]">
        {/* Minimal top bar */}
        <div className="shrink-0 bg-[#11140C]/90 border-b border-lime-500/10 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/")}
              className="inline-flex items-center gap-1.5 text-sm font-body text-slate-400 hover:text-[#D0F219] hover:bg-lime-400/10 px-2 py-1 rounded-lg transition-all"
            >
              <ArrowLeft size={16} />
              Back
            </button>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-[11px] font-semibold font-body">
              <Clock size={11} />
              Verification Pending
            </span>
          </div>
          <button
            onClick={() => {
              dispatch(logout());
              if (typeof window !== "undefined") {
                localStorage.removeItem("byteshelf_access_token");
                localStorage.removeItem("auth_tokens");
              }
              router.push("/login");
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 border border-slate-700/70 text-slate-300 rounded-full text-xs font-body font-medium hover:bg-white/[0.04] hover:text-[#D0F219] active:scale-95 transition-all"
          >
            <LogOut size={13} />
            Logout
          </button>
        </div>
        <main className="flex-1">{children}</main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#0D0F0A]">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
      <FloatingChatButton />
    </div>
  );
}
