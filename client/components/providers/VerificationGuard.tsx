"use client";

import { useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  Shield,
  Clock,
  LogOut,
  AlertCircle,
  Loader2,
  XCircle,
  Copy,
  Check,
  MessageCircle,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { logout } from "@/redux/slices/authSlice";
import api from "@/lib/axios";
import AmbientBackground from "@/components/ui/AmbientBackground";

// ─── Pending Overlay ────────────────────────────────────────────────────────────

function PendingOverlay({ email, userId }: { email: string | null; userId: string | null }) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(userId || "");
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = userId || "";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    if (typeof window !== "undefined") {
      localStorage.removeItem("byteshelf_access_token");
      localStorage.removeItem("auth_tokens");
    }
    router.push("/login");
  };

  const handleChatWithAdmin = useCallback(async () => {
    setChatLoading(true);
    try {
      // 1. Fetch first admin user
      const adminRes = await api.get("/admin/contact");
      const admin = adminRes.data?.data;
      if (!admin?._id) throw new Error("No admin found");

      // 2. Start a conversation with the admin
      const convRes = await api.post("/conversation/start", {
        participantId: admin._id,
      });
      const conversation = convRes.data?.data || convRes.data;
      const conversationId = conversation?._id || conversation?.id;

      if (conversationId) {
        router.push(`/messages?conversationId=${conversationId}`);
      } else {
        // If no conversation ID, just go to messages
        router.push("/messages");
      }
    } catch (err: any) {
      // Fallback: navigate to messages page anyway
      router.push("/messages");
    } finally {
      setChatLoading(false);
    }
  }, [router]);

  return (
    <div className="fixed inset-0 z-[100] overflow-hidden bg-[#05080e]">
      <AmbientBackground />
      {/* Safe-scroll centering: background stays fixed, card scrolls on short viewports */}
      <div className="absolute inset-0 overflow-y-auto overscroll-contain">
        <div className="min-h-full flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 120, damping: 20 }}
            className="relative z-10 w-full max-w-lg my-auto"
          >
            <div className="bg-slate-900/60 border border-slate-800/80 backdrop-blur-2xl rounded-3xl p-8 shadow-[0_0_50px_rgba(0,0,0,0.8)] flex flex-col items-center text-center gap-6">
              {/* Icon — amber glow */}
              <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shadow-[0_0_30px_rgba(245,158,11,0.15)]">
                <Shield size={32} className="text-amber-400" />
              </div>

              {/* Status badge */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold font-body">
                <Clock size={12} />
                Pending Review
              </div>

              {/* Title & Message */}
              <div>
                <h1 className="font-heading text-2xl font-bold text-slate-100">
                  Account Verification Pending
                </h1>
                <p className="mt-3 text-sm text-slate-400 font-body leading-relaxed">
                  Your KYC verification request is currently under review by our
                  team. You will get full access to the dashboard once your account
                  is approved.
                </p>
              </div>

              {/* Logged-in email */}
              {email && (
                <div className="text-xs text-slate-500 font-body">
                  Logged in as{" "}
                  <span className="font-medium text-slate-300">{email}</span>
                </div>
              )}

              {/* User ID with copy — dark inner container */}
              {userId && (
                <div className="w-full">
                  <div className="flex items-center justify-between bg-slate-950 border border-slate-800/80 rounded-xl p-3">
                    <div className="flex items-center gap-2 min-w-0 flex-1 mr-2">
                      <span className="text-[10px] text-slate-500 uppercase font-semibold tracking-wider whitespace-nowrap font-body">
                        USER ID:
                      </span>
                      <code className="text-xs font-mono text-slate-300 font-medium break-all">
                        {userId}
                      </code>
                    </div>
                    <button
                      onClick={handleCopy}
                      title="Copy User ID"
                      className={`p-1.5 rounded-lg border transition-all duration-200 shrink-0 ${
                        copied
                          ? "bg-[#ccff00]/15 border-[#ccff00]/40 text-[#ccff00]"
                          : "bg-white/[0.04] border-slate-700/70 text-slate-400 hover:text-[#ccff00] hover:bg-lime-400/10 hover:border-lime-500/40"
                      }`}
                    >
                      {copied ? <Check size={16} className="text-[#ccff00]" /> : <Copy size={16} />}
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-500 font-body mt-2 text-center">
                    Provide this User ID to an admin/support if you need quick
                    assistance with your verification.
                  </p>
                </div>
              )}

              {/* Chat with Admin — solid lime primary */}
              <button
                onClick={handleChatWithAdmin}
                disabled={chatLoading}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 bg-[#ccff00] text-black rounded-xl text-sm font-body font-semibold hover:bg-[#b8e600] shadow-[0_0_20px_rgba(204,255,0,0.15)] hover:shadow-[0_0_30px_rgba(204,255,0,0.3)] active:scale-95 transition-all duration-200 disabled:opacity-60"
              >
                {chatLoading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <MessageCircle size={16} />
                )}
                {chatLoading ? "Connecting..." : "Chat with Admin"}
              </button>

              {/* Only action: Logout — dark glassy secondary */}
              <button
                onClick={handleLogout}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 bg-slate-800/50 text-slate-300 border border-slate-700/60 rounded-xl text-sm font-body font-medium hover:bg-slate-800 hover:text-white active:scale-95 transition-all duration-200"
              >
                <LogOut size={16} />
                Logout
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

// ─── Rejected Overlay ───────────────────────────────────────────────────────────

function RejectedOverlay({
  email,
  reason,
}: {
  email: string | null;
  reason?: string;
}) {
  const dispatch = useAppDispatch();
  const router = useRouter();

  const handleLogout = () => {
    dispatch(logout());
    if (typeof window !== "undefined") {
      localStorage.removeItem("byteshelf_access_token");
      localStorage.removeItem("auth_tokens");
    }
    router.push("/login");
  };

  return (
    <div className="fixed inset-0 z-[100] overflow-hidden bg-[#05080e]">
      <AmbientBackground />
      {/* Safe-scroll centering: background stays fixed, card scrolls on short viewports */}
      <div className="absolute inset-0 overflow-y-auto overscroll-contain">
        <div className="min-h-full flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 120, damping: 20 }}
            className="relative z-10 w-full max-w-lg my-auto"
          >
            <div className="bg-slate-900/60 border border-slate-800/80 backdrop-blur-2xl rounded-3xl p-8 shadow-[0_0_50px_rgba(0,0,0,0.8)] flex flex-col items-center text-center gap-6">
              {/* Icon — crimson/rose glow */}
              <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center shadow-[0_0_30px_rgba(244,63,94,0.15)]">
                <XCircle size={32} className="text-rose-400" />
              </div>

              {/* Status badge */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold font-body">
                <AlertCircle size={12} />
                Verification Rejected
              </div>

              {/* Title & Message */}
              <div>
                <h1 className="font-heading text-2xl font-bold text-slate-100">
                  Verification Not Approved
                </h1>
                <p className="mt-3 text-sm text-slate-400 font-body leading-relaxed">
                  Your account verification was not approved. Please contact support
                  for more information or submit a new verification request.
                </p>
              </div>

              {/* Rejection reason */}
              {reason && (
                <div className="w-full p-4 rounded-2xl bg-slate-950/60 border border-rose-500/20 text-left">
                  <p className="text-xs font-semibold text-rose-400 uppercase tracking-wider font-body mb-1">
                    Reason
                  </p>
                  <p className="text-sm text-rose-300/90 font-body">{reason}</p>
                </div>
              )}

              {/* Logged-in email */}
              {email && (
                <div className="text-xs text-slate-500 font-body">
                  Logged in as{" "}
                  <span className="font-medium text-slate-300">{email}</span>
                </div>
              )}

              {/* Only action: Logout — dark glassy secondary */}
              <button
                onClick={handleLogout}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 bg-slate-800/50 text-slate-300 border border-slate-700/60 rounded-xl text-sm font-body font-medium hover:bg-slate-800 hover:text-white active:scale-95 transition-all duration-200"
              >
                <LogOut size={16} />
                Logout
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// GUARD
// ═══════════════════════════════════════════════════════════════════════════════

export default function VerificationGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user, isCheckingAuth, accessToken } = useAppSelector(
    (state) => state.auth
  );

  // ─── Public routes: skip auth loader entirely (no flicker) ──────────────
  const publicRoutes = ["/", "/login", "/signup", "/verify-otp", "/about", "/contact", "/explore", "/cookie-policy", "/privacy-policy", "/terms"];
  if (isCheckingAuth && publicRoutes.includes(pathname)) {
    return <>{children}</>;
  }

  // ─── Show loader while auth is being checked (protected routes only) ────
  if (isCheckingAuth) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#05080e]">
        <Loader2 size={32} className="animate-spin text-[#ccff00]" />
      </div>
    );
  }

  // ─── No user / not logged in — render children normally ─────────────────
  if (!accessToken || !user) {
    return <>{children}</>;
  }

  // ─── Admin users bypass all checks ──────────────────────────────────────
  const isUserAdmin = !!(user.isAdmin || user.role === "admin");
  if (isUserAdmin) {
    return <>{children}</>;
  }

  // ─── Approved users — full access ───────────────────────────────────────
  if (user.verificationStatus === "approved") {
    return <>{children}</>;
  }

  // ─── Pending users ──────────────────────────────────────────────────────
  if (user.verificationStatus === "pending") {
    // Allow ONLY /messages route with a simplified layout
    if (pathname === "/messages") {
      return <>{children}</>;
    }
    // All other routes → blocking overlay
    return <PendingOverlay email={user.email} userId={user.id} />;
  }

  // ─── Rejected users — show rejection overlay ────────────────────────────
  if (user.verificationStatus === "rejected") {
    return (
      <RejectedOverlay
        email={user.email}
        reason={user.rejectionReason || undefined}
      />
    );
  }

  // ─── Fallback (e.g. no verificationStatus set) — allow access ───────────
  return <>{children}</>;
}
