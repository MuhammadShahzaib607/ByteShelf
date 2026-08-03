"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Shield,
  Clock,
  RefreshCw,
  LogOut,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { logout } from "@/redux/slices/authSlice";
import { fetchProfile } from "@/redux/slices/profileSlice";
import AmbientBackground from "@/components/ui/AmbientBackground";

export default function VerificationPendingPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user, isCheckingAuth } = useAppSelector((state) => state.auth);
  const [refreshing, setRefreshing] = useState(false);

  // If user is already approved, redirect to explore
  useEffect(() => {
    if (!isCheckingAuth && user?.verificationStatus === "approved" && user?.isVerified) {
      router.replace("/explore");
    }
  }, [user, isCheckingAuth, router]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await dispatch(fetchProfile());
    } catch {
      // handled
    }
    setRefreshing(false);
  };

  const handleLogout = () => {
    dispatch(logout());
    router.push("/login");
  };

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-[#05080e] flex items-center justify-center p-4">
        <Loader2 size={32} className="animate-spin text-[#99cc00]" />
      </div>
    );
  }

  const isRejected = user?.verificationStatus === "rejected";

  return (
    <div className="relative min-h-screen bg-[#05080e] flex items-center justify-center p-4 overflow-hidden">
      <AmbientBackground />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 120, damping: 20 }}
        className="relative z-10 w-full max-w-lg"
      >
        <div className="bg-slate-900/60 border border-slate-800/80 backdrop-blur-2xl rounded-3xl p-8 shadow-[0_0_50px_rgba(0,0,0,0.8)] flex flex-col items-center text-center gap-6">
          {/* Icon — amber (pending) / rose (rejected) glow */}
          <div className={`w-16 h-16 rounded-2xl border flex items-center justify-center ${
            isRejected
              ? "bg-rose-500/10 border-rose-500/20 shadow-[0_0_30px_rgba(244,63,94,0.15)]"
              : "bg-amber-500/10 border-amber-500/20 shadow-[0_0_30px_rgba(245,158,11,0.15)]"
          }`}>
            {isRejected ? (
              <AlertCircle size={32} className="text-rose-400" />
            ) : (
              <Shield size={32} className="text-amber-400" />
            )}
          </div>

          {/* Status badge */}
          <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold font-body ${
            isRejected
              ? "bg-rose-500/10 border border-rose-500/20 text-rose-400"
              : "bg-amber-500/10 border border-amber-500/20 text-amber-400"
          }`}>
            {isRejected ? <AlertCircle size={12} /> : <Clock size={12} />}
            {isRejected ? "Verification Rejected" : "Pending Review"}
          </div>

          {/* Title */}
          <div>
            <h1 className="font-heading text-2xl font-bold text-slate-100">
              {isRejected ? "Verification Rejected" : "Verification Pending"}
            </h1>
            <p className="mt-2 text-sm text-slate-400 font-body leading-relaxed">
              {isRejected
                ? "Your account verification was not approved. Please contact support for more information."
                : "Your account verification is currently under review by our admin team. Please wait while we verify your submitted identity documents."}
            </p>
          </div>

          {/* Rejection reason */}
          {isRejected && user?.verificationStatus === "rejected" && (
            <div className="w-full p-4 rounded-2xl bg-slate-950/60 border border-rose-500/20 text-left">
              <p className="text-xs font-semibold text-rose-400 uppercase tracking-wider font-body mb-1">
                Reason
              </p>
              <p className="text-sm text-rose-300/90 font-body">
                {(user as any)?.rejectionReason || "No specific reason provided."}
              </p>
            </div>
          )}

          {/* Info card */}
          {!isRejected && (
            <div className="w-full p-4 rounded-2xl bg-slate-950/60 border border-amber-500/20 flex items-start gap-3">
              <Clock size={18} className="text-amber-400 shrink-0 mt-0.5" />
              <div className="text-left">
                <p className="text-sm font-semibold text-amber-300 font-body">
                  What happens next?
                </p>
                <p className="text-xs text-amber-200/60 font-body mt-1">
                  An admin will review your submitted KYC documents. You will
                  gain full access to the platform once approved.
                </p>
              </div>
            </div>
          )}

          {/* User email */}
          <div className="text-xs text-slate-500 font-body">
            Logged in as <span className="font-medium text-slate-300">{user?.email || "..."}</span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 w-full">
            <button
              onClick={handleRefresh}
              disabled={refreshing || isRejected}
              className={`flex-1 inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl text-sm font-body transition-all duration-200 ${
                isRejected
                  ? "bg-slate-800/50 text-slate-500 border border-slate-700/60 cursor-not-allowed"
                  : "bg-[#99cc00] text-black font-semibold hover:bg-[#8ab800] shadow-[0_0_20px_rgba(153,204,0,0.10)] hover:shadow-[0_0_30px_rgba(153,204,0,0.20)] active:scale-95"
              }`}
            >
              {refreshing ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <RefreshCw size={16} />
              )}
              {refreshing ? "Refreshing..." : "Refresh Status"}
            </button>
            <button
              onClick={handleLogout}
              className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3.5 bg-slate-800/50 text-slate-300 border border-slate-700/60 rounded-xl text-sm font-body font-medium hover:bg-slate-800 hover:text-white active:scale-95 transition-all duration-200"
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
