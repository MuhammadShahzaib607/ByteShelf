"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Mail,
  Phone,
  ShieldCheck,
  CheckCircle,
  XCircle,
  Save,
  Loader2,
  Store,
  Warehouse,
  HardHat,
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  fetchProfile,
  updateProfile,
  clearProfileError,
  clearProfileSuccess,
} from "@/redux/slices/profileSlice";
import { setUser } from "@/redux/slices/authSlice";

// ─── Role Option Config ─────────────────────────────────────────────────────────

const roleOptions = [
  { value: "merchant", label: "Merchant", icon: Store },
  { value: "warehouseOwner", label: "Warehouse Owner", icon: Warehouse },
  { value: "worker", label: "Worker", icon: HardHat },
];

// ─── Toast Component ────────────────────────────────────────────────────────────

function Toast({
  message,
  type,
  onClose,
}: {
  message: string;
  type: "success" | "error";
  onClose: () => void;
}) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3500);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className={`fixed top-28 right-6 z-[60] flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl border backdrop-blur-md ${
        type === "success"
          ? "bg-emerald-50 border-emerald-200 text-emerald-800"
          : "bg-red-50 border-red-200 text-red-800"
      }`}
    >
      {type === "success" ? (
        <CheckCircle size={20} className="shrink-0 text-emerald-500" />
      ) : (
        <XCircle size={20} className="shrink-0 text-red-500" />
      )}
      <span className="text-sm font-body font-medium">{message}</span>
      <button
        onClick={onClose}
        className="ml-2 p-1 rounded-full hover:bg-black/5 transition-colors"
        aria-label="Dismiss notification"
      >
        <XCircle size={14} className="opacity-50" />
      </button>
    </motion.div>
  );
}

// ─── Skeleton Loader ────────────────────────────────────────────────────────────

function ProfileSkeleton() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
      <Navbar />
      <main className="flex-1 flex items-center justify-center px-4 pt-32 pb-20">
        <div className="w-full max-w-2xl bg-white rounded-3xl shadow-xl border border-[#0284C7]/15 p-8 md:p-10 animate-pulse">
          <div className="h-8 bg-[#F8FAFC] rounded-lg w-40 mb-8" />
          <div className="flex items-center gap-5 mb-8">
            <div className="w-16 h-16 rounded-2xl bg-[#F8FAFC]" />
            <div className="space-y-2 flex-1">
              <div className="h-5 bg-[#F8FAFC] rounded w-48" />
              <div className="h-4 bg-[#F8FAFC] rounded w-64" />
            </div>
          </div>
          <div className="space-y-6">
            <div className="h-12 bg-[#F8FAFC] rounded-xl w-full" />
            <div className="h-12 bg-[#F8FAFC] rounded-xl w-full" />
            <div className="h-12 bg-[#F8FAFC] rounded-full w-full mt-8" />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PAGE
// ═══════════════════════════════════════════════════════════════════════════════

export default function ProfilePage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { accessToken } = useAppSelector((state) => state.auth);
  const { user, isLoading, isUpdating, error, successMessage } = useAppSelector(
    (state) => state.profile
  );

  // Local form state
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("");
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const hasFetched = useRef(false);

  // ─── Auth guard ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!accessToken) {
      router.replace("/login");
    }
  }, [accessToken, router]);

  // ─── Fetch profile on mount ───────────────────────────────────────────────────
  useEffect(() => {
    if (accessToken && !hasFetched.current) {
      hasFetched.current = true;
      dispatch(fetchProfile());
    }
  }, [accessToken, dispatch]);

  // ─── Pre-fill form when user data loads ───────────────────────────────────────
  useEffect(() => {
    if (user) {
      setPhone(user.phone || "");
      setRole(user.role || "");
    }
  }, [user]);

  // ─── Show toast on success / error ────────────────────────────────────────────
  useEffect(() => {
    if (successMessage) {
      setToast({ message: successMessage, type: "success" });
      dispatch(clearProfileSuccess());
    }
  }, [successMessage, dispatch]);

  useEffect(() => {
    if (error) {
      setToast({ message: error, type: "error" });
      dispatch(clearProfileError());
    }
  }, [error, dispatch]);

  // ─── Submit handler ───────────────────────────────────────────────────────────
  const handleSubmit = useCallback(async () => {
    const payload: { phone?: string; role?: string } = {};
    if (phone !== (user?.phone || "")) payload.phone = phone;
    if (role !== (user?.role || "")) payload.role = role;
    if (Object.keys(payload).length === 0) {
      setToast({ message: "No changes to save.", type: "error" });
      return;
    }
    try {
      const result = await dispatch(updateProfile(payload)).unwrap();
      // Sync auth user state immediately so Navbar role links update in-place
      if (result.user) {
        const u = result.user;
        dispatch(setUser({
          id: u._id || u.id || null,
          email: u.email || null,
          role: u.role || null,
          name: u.name || null,
        }));
      }
    } catch {
      // Error handled by Redux state
    }
  }, [phone, role, user, dispatch]);

  // ─── Loading state ────────────────────────────────────────────────────────────
  if (isLoading && !user) {
    return <ProfileSkeleton />;
  }

  // ─── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
      <Navbar />

      {/* Toast notification */}
      <AnimatePresence>
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </AnimatePresence>

      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 pt-32 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
          className="w-full max-w-2xl bg-white rounded-3xl shadow-xl border border-[#0284C7]/15 p-8 md:p-10"
        >
          {/* ═══ Header ═══ */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#F8FAFC] flex items-center justify-center">
                <User size={20} className="text-[#0284C7]" />
              </div>
              <h1 className="font-heading text-2xl md:text-3xl font-bold text-[#1E293B] tracking-tight">
                My Profile
              </h1>
            </div>
          </div>

          {/* ═══ Read-Only User Card ═══ */}
          {user && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="flex items-start gap-4 md:gap-5 p-5 md:p-6 rounded-2xl bg-[#F8FAFC]/40 border border-[#0284C7]/10 mb-8"
            >
              {/* Avatar */}
              <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-[#1E293B]/10 flex items-center justify-center shrink-0">
                <User size={28} className="text-[#1E293B]/60" />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h2 className="font-heading text-lg md:text-xl font-semibold text-[#1E293B] truncate">
                    {user.name}
                  </h2>
                  {user.isVerified && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-body font-medium">
                      <ShieldCheck size={12} />
                      Verified
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 mt-1 text-sm text-[#0F172A]/50 font-body">
                  <Mail size={14} />
                  <span className="truncate">{user.email}</span>
                </div>
                {/* Smaller role badge */}
                <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/60 border border-[#0284C7]/15 text-[11px] text-[#0284C7] font-body font-medium capitalize">
                  {roleOptions.find((r) => r.value === user.role)?.icon && (
                    <span>
                      {(() => {
                        const Icon =
                          roleOptions.find((r) => r.value === user.role)
                            ?.icon || Store;
                        return <Icon size={12} />;
                      })()}
                    </span>
                  )}
                  {user.role === "warehouseOwner"
                    ? "Warehouse Owner"
                    : user.role === "merchant"
                    ? "Merchant"
                    : "Worker"}
                </div>
              </div>
            </motion.div>
          )}

          {/* ═══ Editable Form ═══ */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="space-y-6"
          >
            {/* ── Phone Field ── */}
            <div>
              <label className="text-xs font-semibold tracking-wider text-[#1E293B] uppercase mb-1.5 block font-body">
                Phone Number
              </label>
              <div className="relative">
                <Phone
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-[#0284C7]/60 pointer-events-none"
                />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  className="w-full pl-11 pr-4 py-3.5 bg-[#F8FAFC]/40 border border-[#0284C7]/20 rounded-xl text-[#0F172A] placeholder:text-[#0F172A]/30 focus:outline-none focus:border-[#0284C7] focus:bg-white transition-all text-sm font-body"
                />
              </div>
            </div>

            {/* ── Role Selector ── */}
            <div>
              <label className="text-xs font-semibold tracking-wider text-[#1E293B] uppercase mb-3 block font-body">
                Account Role
              </label>
              <div className="grid grid-cols-3 gap-2.5">
                {roleOptions.map((opt) => {
                  const isActive = role === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setRole(opt.value)}
                      className={`flex flex-col items-center justify-center gap-1.5 p-4 min-h-[80px] rounded-xl border-2 text-sm font-body font-medium transition-all duration-200 ${
                        isActive
                          ? "bg-[#1E293B] text-white border-[#1E293B] shadow-sm"
                          : "bg-transparent text-[#0284C7] border-[#0284C7]/30 hover:border-[#0284C7]/60 hover:bg-[#F8FAFC]/30"
                      }`}
                    >
                      <opt.icon size={20} />
                      <span className="text-[11px] leading-tight text-center">
                        {opt.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ── Submit Button ── */}
            <div className="pt-4">
              <button
                onClick={handleSubmit}
                disabled={isUpdating}
                className="w-full inline-flex items-center justify-center gap-2.5 px-6 py-3.5 bg-[#1E293B] text-white rounded-full font-body font-medium text-sm hover:bg-[#0284C7] transition-all duration-300 shadow-md hover:shadow-lg active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:bg-[#1E293B]"
              >
                {isUpdating ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}
