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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#FAFAFA]">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="bg-white border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.06)] rounded-3xl p-8 md:p-10 flex flex-col items-center text-center gap-6">
          {/* Icon */}
          <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center">
            <Shield size={32} className="text-amber-500" />
          </div>

          {/* Status badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold font-body">
            <Clock size={12} />
            Pending Review
          </div>

          {/* Title & Message */}
          <div>
            <h1 className="font-heading text-2xl font-bold text-[#1E293B]">
              Account Verification Pending
            </h1>
            <p className="mt-3 text-sm text-[#0F172A]/60 font-body leading-relaxed">
              Your KYC verification request is currently under review by our
              team. You will get full access to the dashboard once your account
              is approved.
            </p>
          </div>

          {/* Logged-in email */}
          {email && (
            <div className="text-xs text-[#0F172A]/40 font-body">
              Logged in as{" "}
              <span className="font-medium text-[#0F172A]/60">{email}</span>
            </div>
          )}

          {/* User ID with copy — inline layout */}
          {userId && (
            <div className="w-full">
              <div className="flex items-center justify-between bg-[#F8FAFC]/80 border border-slate-200/60 rounded-xl p-3">
                <div className="flex items-center gap-2 min-w-0 flex-1 mr-2">
                  <span className="text-[10px] text-[#0F172A]/40 uppercase font-semibold tracking-wider whitespace-nowrap font-body">
                    USER ID:
                  </span>
                  <code className="text-xs font-mono text-[#0F172A]/70 font-medium break-all">
                    {userId}
                  </code>
                </div>
                <button
                  onClick={handleCopy}
                  title="Copy User ID"
                  className={`p-1.5 rounded-lg border transition-all duration-200 shrink-0 ${
                    copied
                      ? "bg-emerald-50 border-emerald-200 text-emerald-600"
                      : "bg-white border-slate-200 text-[#0F172A]/40 hover:text-[#0F172A]/70 hover:bg-slate-100 hover:border-slate-300"
                  }`}
                >
                  {copied ? <Check size={16} className="text-emerald-600" /> : <Copy size={16} />}
                </button>
              </div>
              <p className="text-[11px] text-[#0F172A]/40 font-body mt-2 text-center">
                Provide this User ID to an admin/support if you need quick
                assistance with your verification.
              </p>
            </div>
          )}

          {/* Chat with Admin */}
          <button
            onClick={handleChatWithAdmin}
            disabled={chatLoading}
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 bg-[#0284C7] text-white rounded-full text-sm font-body font-medium hover:bg-[#0284C7]/90 hover:shadow-lg hover:shadow-[#0284C7]/20 active:scale-95 transition-all duration-200 disabled:opacity-60"
          >
            {chatLoading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <MessageCircle size={16} />
            )}
            {chatLoading ? "Connecting..." : "Chat with Admin"}
          </button>

          {/* Only action: Logout */}
          <button
            onClick={handleLogout}
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 border border-slate-200 text-slate-700 rounded-full text-sm font-body font-medium hover:bg-slate-50 active:scale-95 transition-all duration-200"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </motion.div>
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#FAFAFA]">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="bg-white border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.06)] rounded-3xl p-8 md:p-10 flex flex-col items-center text-center gap-6">
          {/* Icon */}
          <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center">
            <XCircle size={32} className="text-red-500" />
          </div>

          {/* Status badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 border border-red-200 text-red-700 text-xs font-semibold font-body">
            <AlertCircle size={12} />
            Verification Rejected
          </div>

          {/* Title & Message */}
          <div>
            <h1 className="font-heading text-2xl font-bold text-[#1E293B]">
              Verification Not Approved
            </h1>
            <p className="mt-3 text-sm text-[#0F172A]/60 font-body leading-relaxed">
              Your account verification was not approved. Please contact support
              for more information or submit a new verification request.
            </p>
          </div>

          {/* Rejection reason */}
          {reason && (
            <div className="w-full p-4 rounded-2xl bg-red-50/50 border border-red-100 text-left">
              <p className="text-xs font-semibold text-red-700 uppercase tracking-wider font-body mb-1">
                Reason
              </p>
              <p className="text-sm text-red-600 font-body">{reason}</p>
            </div>
          )}

          {/* Logged-in email */}
          {email && (
            <div className="text-xs text-[#0F172A]/40 font-body">
              Logged in as{" "}
              <span className="font-medium text-[#0F172A]/60">{email}</span>
            </div>
          )}

          {/* Only action: Logout */}
          <button
            onClick={handleLogout}
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 bg-slate-900 text-white rounded-full text-sm font-body font-medium hover:bg-slate-800 hover:shadow-lg hover:shadow-slate-900/20 active:scale-95 transition-all duration-200"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </motion.div>
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

  // ─── Show loader while auth is being checked ────────────────────────────
  if (isCheckingAuth) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#FAFAFA]">
        <Loader2 size={32} className="animate-spin text-[#0284C7]" />
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
