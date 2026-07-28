"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Loader2, LogOut, Clock, ArrowLeft } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { logout } from "@/redux/slices/authSlice";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import FloatingChatButton from "@/components/ui/FloatingChatButton";
import DashboardLayout from "./dashboard/layout";

export default function PagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const { accessToken, user, isCheckingAuth } = useAppSelector((state) => state.auth);

  // ─── Detect dashboard routes (render sidebar layout instead of public Navbar/Footer) ─
  const isDashboard = pathname.startsWith("/dashboard");

  // ─── Detect if we should show a stripped-down layout (pending user on /messages) ─
  const isPendingOnChat =
    !!user && !!accessToken && user.verificationStatus === "pending" && pathname === "/messages";

  useEffect(() => {
    if (isCheckingAuth) return;
    if (!accessToken) {
      router.replace("/login");
    }
  }, [accessToken, isCheckingAuth, router]);

  // ─── Show loading spinner while checking auth ────────────────────────────

  if (isCheckingAuth) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-white">
        <Loader2 size={32} className="animate-spin text-[#0284C7]" />
      </div>
    );
  }

  // ─── Dashboard routes — render sidebar layout without public Navbar/Footer ─
  if (isDashboard) {
    return <DashboardLayout>{children}</DashboardLayout>;
  }

  // ─── Pending user on /messages — stripped layout (no Navbar/Footer/ChatButton) ─
  if (isPendingOnChat) {
    return (
      <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
        {/* Minimal top bar */}
        <div className="shrink-0 bg-white border-b border-slate-200/60 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/")}
              className="inline-flex items-center gap-1.5 text-sm font-body text-[#0F172A]/60 hover:text-[#0F172A] hover:bg-slate-100 px-2 py-1 rounded-lg transition-all"
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
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 border border-slate-200 text-slate-700 rounded-full text-xs font-body font-medium hover:bg-slate-50 active:scale-95 transition-all"
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
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
      <FloatingChatButton />
    </div>
  );
}
