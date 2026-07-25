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
  CheckCircle,
  Loader2,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { logout } from "@/redux/slices/authSlice";
import { fetchProfile } from "@/redux/slices/profileSlice";

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
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center p-4">
        <Loader2 size={32} className="animate-spin text-[#0284C7]" />
      </div>
    );
  }

  const isRejected = user?.verificationStatus === "rejected";

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="bg-white/80 backdrop-blur-xl border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-3xl p-8 md:p-10 flex flex-col items-center text-center gap-6">
          {/* Icon */}
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${
            isRejected ? "bg-red-50" : "bg-amber-50"
          }`}>
            {isRejected ? (
              <AlertCircle size={32} className="text-red-500" />
            ) : (
              <Shield size={32} className="text-amber-500" />
            )}
          </div>

          {/* Title */}
          <div>
            <h1 className="font-heading text-2xl font-bold text-[#1E293B]">
              {isRejected ? "Verification Rejected" : "Verification Pending"}
            </h1>
            <p className="mt-2 text-sm text-[#0F172A]/60 font-body leading-relaxed">
              {isRejected
                ? "Your account verification was not approved. Please contact support for more information."
                : "Your account verification is currently under review by our admin team. Please wait while we verify your submitted identity documents."}
            </p>
          </div>

          {/* Rejection reason */}
          {isRejected && user?.verificationStatus === "rejected" && (
            <div className="w-full p-4 rounded-2xl bg-red-50/50 border border-red-100 text-left">
              <p className="text-xs font-semibold text-red-700 uppercase tracking-wider font-body mb-1">
                Reason
              </p>
              <p className="text-sm text-red-600 font-body">
                {(user as any)?.rejectionReason || "No specific reason provided."}
              </p>
            </div>
          )}

          {/* Info card */}
          {!isRejected && (
            <div className="w-full p-4 rounded-2xl bg-amber-50/50 border border-amber-100 flex items-start gap-3">
              <Clock size={18} className="text-amber-500 shrink-0 mt-0.5" />
              <div className="text-left">
                <p className="text-sm font-semibold text-amber-800 font-body">
                  What happens next?
                </p>
                <p className="text-xs text-amber-700/70 font-body mt-1">
                  An admin will review your submitted KYC documents. You will
                  gain full access to the platform once approved.
                </p>
              </div>
            </div>
          )}

          {/* User email */}
          <div className="text-xs text-[#0F172A]/40 font-body">
            Logged in as <span className="font-medium text-[#0F172A]/60">{user?.email || "..."}</span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 w-full">
            <button
              onClick={handleRefresh}
              disabled={refreshing || isRejected}
              className={`flex-1 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full text-sm font-body font-medium transition-all duration-200 ${
                isRejected
                  ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                  : "bg-slate-900 text-white hover:bg-slate-800 hover:shadow-lg hover:shadow-slate-900/20 active:scale-95"
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
              className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-2.5 border border-slate-200 text-slate-700 rounded-full text-sm font-body font-medium hover:bg-slate-50 active:scale-95 transition-all duration-200"
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
