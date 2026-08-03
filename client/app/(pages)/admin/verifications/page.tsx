"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  User,
  Mail,
  CalendarDays,
  Loader2,
  AlertCircle,
  CheckCircle,
  XCircle,
  Image as ImageIcon,
  Video,
  ThumbsUp,
  ThumbsDown,
  X,
  Clock,
  Search,
  Filter,
  Undo2,
} from "lucide-react";
import { useAppSelector } from "@/redux/hooks";
import api from "@/lib/axios";

// ─── Types ──────────────────────────────────────────────────────────────────────

type FilterStatus = "all" | "pending" | "approved" | "rejected";

interface KycUser {
  _id: string;
  name: string;
  email: string;
  role: string;
  verificationStatus: string;
  isVerified: boolean;
  kycDocuments?: {
    nicFront: string;
    nicBack: string;
    livePhoto: string;
    liveVideo: string;
  };
  createdAt: string;
  rejectionReason?: string;
}

const STATUS_TABS: { key: FilterStatus; label: string; count: string }[] = [
  { key: "all", label: "All", count: "" },
  { key: "pending", label: "Pending", count: "" },
  { key: "approved", label: "Approved", count: "" },
  { key: "rejected", label: "Rejected", count: "" },
];

// ═══════════════════════════════════════════════════════════════════════════════
// PAGE
// ═══════════════════════════════════════════════════════════════════════════════

export default function AdminVerificationsPage() {
  const router = useRouter();
  const { user, accessToken, isCheckingAuth } = useAppSelector((state) => state.auth);

  const [users, setUsers] = useState<KycUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ─── Filter & Search state ──────────────────────────────────────────────
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("pending");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const searchTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Debounce search input (350ms)
  useEffect(() => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 350);
    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    };
  }, [searchQuery]);

  // ─── Preview modal state ────────────────────────────────────────────────
  const [selectedUser, setSelectedUser] = useState<KycUser | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [previewLabel, setPreviewLabel] = useState("");

  // ─── Reject modal state ─────────────────────────────────────────────────
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // ─── Status counts (computed from users array) ───────────────────────────
  const statusCounts = useMemo(() => {
    const counts = { all: users.length, pending: 0, approved: 0, rejected: 0 };
    users.forEach((u) => {
      const s = u.verificationStatus as FilterStatus;
      if (s in counts) counts[s]++;
    });
    return counts;
  }, [users]);

  // ─── Auth guard ──────────────────────────────────────────────────────────
  // Wait for Redux hydration (isCheckingAuth) AND user object to load before
  // checking admin status — prevents redirect to /explore on refresh.
  // ⚠️ KEEP THIS INTACT — DO NOT MODIFY
  useEffect(() => {
    if (isCheckingAuth) return;

    if (!accessToken) {
      router.replace("/login");
      return;
    }

    // Only redirect if user is fully loaded AND is not an admin
    if (user && !user.isAdmin && user.role !== "admin") {
      router.replace("/explore");
    }
  }, [accessToken, user, isCheckingAuth, router]);

  // ─── Fetch verifications with filter & search ───────────────────────────
  const fetchVerifications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      params.set("status", filterStatus);
      if (debouncedSearch.trim()) params.set("search", debouncedSearch.trim());
      const res = await api.get(`/admin/verifications?${params.toString()}`);
      setUsers(res.data.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load verifications");
    } finally {
      setLoading(false);
    }
  }, [filterStatus, debouncedSearch]);

  // Refetch when filter or search changes
  useEffect(() => {
    if (!accessToken || !user) return;
    if (!user.isAdmin && user.role !== "admin") return;
    fetchVerifications();
  }, [accessToken, user, fetchVerifications, filterStatus, debouncedSearch]);

  // ─── Unified status update ──────────────────────────────────────────────
  const updateStatus = useCallback(
    async (userId: string, status: "approved" | "rejected" | "pending", reason?: string) => {
      if (status === "rejected" && !reason?.trim()) {
        // Open reject modal instead
        setRejectTarget(userId);
        setShowRejectModal(true);
        return;
      }
      setActionLoading(true);
      try {
        const res = await api.patch(`/admin/verifications/${userId}/status`, {
          status,
          reason: reason?.trim() || undefined,
        });
        // Update user in local state with returned data
        const updated = res.data.data;
        if (updated) {
          setUsers((prev) => prev.map((u) => (u._id === userId ? { ...u, ...updated } : u)));
        } else {
          // Fallback: refetch
          fetchVerifications();
        }
        setSelectedUser(null);
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to update status");
      } finally {
        setActionLoading(false);
      }
    },
    [fetchVerifications]
  );

  // ─── Handle reject submission (from modal) ──────────────────────────────
  const handleRejectSubmit = useCallback(async () => {
    if (!rejectTarget || !rejectReason.trim()) return;
    setActionLoading(true);
    try {
      const res = await api.patch(`/admin/verifications/${rejectTarget}/status`, {
        status: "rejected",
        reason: rejectReason.trim(),
      });
      const updated = res.data.data;
      if (updated) {
        setUsers((prev) => prev.map((u) => (u._id === rejectTarget ? { ...u, ...updated } : u)));
      } else {
        fetchVerifications();
      }
      setShowRejectModal(false);
      setRejectTarget(null);
      setRejectReason("");
      setSelectedUser(null);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to reject user");
    } finally {
      setActionLoading(false);
    }
  }, [rejectTarget, rejectReason, fetchVerifications]);

  // ─── Format date ─────────────────────────────────────────────────────────
  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" });

  // ─── Status badge config ─────────────────────────────────────────────────
  const statusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return {
          bg: "bg-emerald-500/10 border-emerald-500/20",
          text: "text-emerald-400",
          icon: CheckCircle,
          label: "Approved",
        };
      case "rejected":
        return {
          bg: "bg-red-500/10 border-red-500/20",
          text: "text-red-400",
          icon: XCircle,
          label: "Rejected",
        };
      default:
        return {
          bg: "bg-amber-500/10 border-amber-500/20",
          text: "text-amber-400",
          icon: Clock,
          label: "Pending",
        };
    }
  };

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-[#0a0d0c] pt-24 md:pt-28 pb-20 px-4 sm:px-6 flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-[#99cc00]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0d0c] pt-24 md:pt-28 pb-20 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-6"
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 text-neutral-300 text-xs font-semibold uppercase tracking-wider border border-white/10">
              Admin
            </div>
          </div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold text-white tracking-tight">
            KYC Verifications
          </h1>
          <p className="mt-1 text-sm text-neutral-400 font-body">
            Manage user identity verification requests
          </p>
        </motion.div>

        {/* Error Banner */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center gap-3"
            >
              <AlertCircle size={18} className="text-red-500 shrink-0" />
              <p className="text-sm text-red-400 font-body">{error}</p>
              <button onClick={() => setError(null)} className="ml-auto text-red-400/70 hover:text-red-300">
                <X size={16} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ═══ FILTER TABS + SEARCH ═══ */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="mb-6 space-y-4"
        >
          {/* Status Filter Tabs */}
          <div className="flex items-center gap-1.5 bg-neutral-900/80 backdrop-blur-sm border border-white/10 rounded-2xl p-1.5 w-fit shadow-sm">
            {STATUS_TABS.map((tab) => {
              const isActive = filterStatus === tab.key;
              const count = statusCounts[tab.key];
              return (
                <button
                  key={tab.key}
                  onClick={() => setFilterStatus(tab.key)}
                  className={`relative flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-body font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-[#99cc00] text-black shadow-md shadow-[#99cc00]/20"
                      : "text-neutral-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {tab.label}
                  {count > 0 && (
                    <span
                      className={`text-[11px] font-semibold px-1.5 py-0.5 rounded-full ${
                        isActive ? "bg-black/20 text-black" : "bg-white/10 text-neutral-400"
                      }`}
                    >
                      {count}
                    </span>
                  )}
                  {count === 0 && isActive && (
                    <span className="text-[11px] font-semibold px-1.5 py-0.5 rounded-full bg-black/20 text-black/70">
                      0
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Search Bar */}
          <div className="relative max-w-md">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, email, or ID..."
              className="w-full pl-9 pr-4 py-2.5 bg-neutral-800/80 backdrop-blur-sm border border-neutral-700 rounded-xl text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:border-[#99cc00] focus:bg-neutral-800 transition-all font-body shadow-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300 transition-all"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </motion.div>

        {/* Loading state */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={28} className="animate-spin text-[#99cc00]" />
          </div>
        )}

        {/* Empty state */}
        {!loading && users.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            {debouncedSearch ? (
              <>
                <div className="w-16 h-16 rounded-2xl bg-neutral-900/80 border border-white/10 flex items-center justify-center mx-auto mb-4 shadow-sm">
                  <Search size={28} className="text-neutral-500" />
                </div>
                <h3 className="font-heading text-lg font-semibold text-white mb-2">
                  No results found
                </h3>
                <p className="text-sm text-neutral-400 font-body max-w-sm mx-auto">
                  No users matching &ldquo;{debouncedSearch}&rdquo; with{" "}
                  {filterStatus === "all"
                    ? "any status"
                    : `"${filterStatus}" status`}
                  .
                </p>
              </>
            ) : filterStatus === "pending" ? (
              <>
                <div className="w-16 h-16 rounded-2xl bg-neutral-900/80 border border-white/10 flex items-center justify-center mx-auto mb-4 shadow-sm">
                  <CheckCircle size={28} className="text-emerald-400" />
                </div>
                <h3 className="font-heading text-lg font-semibold text-white mb-2">
                  All caught up!
                </h3>
                <p className="text-sm text-neutral-400 font-body max-w-sm mx-auto">
                  No pending KYC verification requests at the moment.
                </p>
              </>
            ) : filterStatus === "approved" ? (
              <>
                <div className="w-16 h-16 rounded-2xl bg-neutral-900/80 border border-white/10 flex items-center justify-center mx-auto mb-4 shadow-sm">
                  <CheckCircle size={28} className="text-emerald-400" />
                </div>
                <h3 className="font-heading text-lg font-semibold text-white mb-2">
                  No approved users
                </h3>
                <p className="text-sm text-neutral-400 font-body max-w-sm mx-auto">
                  There are no users with an approved verification status yet.
                </p>
              </>
            ) : filterStatus === "rejected" ? (
              <>
                <div className="w-16 h-16 rounded-2xl bg-neutral-900/80 border border-white/10 flex items-center justify-center mx-auto mb-4 shadow-sm">
                  <XCircle size={28} className="text-red-400" />
                </div>
                <h3 className="font-heading text-lg font-semibold text-white mb-2">
                  No rejected users
                </h3>
                <p className="text-sm text-neutral-400 font-body max-w-sm mx-auto">
                  There are no users with a rejected verification status.
                </p>
              </>
            ) : (
              <>
                <div className="w-16 h-16 rounded-2xl bg-neutral-900/80 border border-white/10 flex items-center justify-center mx-auto mb-4 shadow-sm">
                  <Filter size={28} className="text-neutral-500" />
                </div>
                <h3 className="font-heading text-lg font-semibold text-white mb-2">
                  No users found
                </h3>
                <p className="text-sm text-neutral-400 font-body max-w-sm mx-auto">
                  There are no registered users in the system yet.
                </p>
              </>
            )}
          </motion.div>
        )}

        {/* Users List */}
        {!loading && users.length > 0 && (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0 },
              visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
            }}
            className="space-y-3"
          >
            {users.map((u) => {
              const badge = statusBadge(u.verificationStatus);
              const BadgeIcon = badge.icon;
              return (
                <motion.div
                  key={u._id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  layout
                  className="bg-[#111614]/80 backdrop-blur-xl border border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.4)] rounded-3xl p-5"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-5">
                    {/* Avatar */}
                    <div className="w-11 h-11 rounded-2xl bg-neutral-800 flex items-center justify-center shrink-0">
                      <User size={18} className="text-white" />
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <h3 className="font-heading text-base font-semibold text-white truncate">
                          {u.name}
                        </h3>
                        {/* Status badge */}
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${badge.bg} ${badge.text}`}
                        >
                          <BadgeIcon size={11} />
                          {badge.label}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-neutral-400 font-body">
                        <span className="flex items-center gap-1">
                          <Mail size={11} />
                          {u.email}
                        </span>
                        <span className="capitalize">Role: {u.role}</span>
                        <span className="flex items-center gap-1">
                          <CalendarDays size={11} />
                          {formatDate(u.createdAt)}
                        </span>
                      </div>
                    </div>

                    {/* Dynamic Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => setSelectedUser(u)}
                        className="px-3.5 py-2 bg-neutral-800 text-white rounded-full text-xs font-body font-medium hover:bg-neutral-700 hover:shadow-lg hover:shadow-black/30 active:scale-95 transition-all duration-200"
                      >
                        Review Docs
                      </button>

                      {u.verificationStatus === "pending" && (
                        <>
                          <button
                            onClick={() => updateStatus(u._id, "approved")}
                            disabled={actionLoading}
                            className="p-2 rounded-full bg-[#99cc00] text-black hover:bg-[#8ab800] active:scale-95 transition-all disabled:opacity-50"
                            title="Approve"
                          >
                            <ThumbsUp size={15} />
                          </button>
                          <button
                            onClick={() => updateStatus(u._id, "rejected")}
                            disabled={actionLoading}
                            className="p-2 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 active:scale-95 transition-all disabled:opacity-50"
                            title="Reject"
                          >
                            <ThumbsDown size={15} />
                          </button>
                        </>
                      )}

                      {u.verificationStatus === "approved" && (
                        <>
                          <button
                            onClick={() => updateStatus(u._id, "pending")}
                            disabled={actionLoading}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 hover:bg-amber-500/20 active:scale-95 transition-all text-xs font-body font-medium disabled:opacity-50"
                            title="Move back to pending"
                          >
                            <Undo2 size={13} />
                            Pending
                          </button>
                          <button
                            onClick={() => updateStatus(u._id, "rejected")}
                            disabled={actionLoading}
                            className="p-2 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 active:scale-95 transition-all disabled:opacity-50"
                            title="Reject"
                          >
                            <ThumbsDown size={15} />
                          </button>
                        </>
                      )}

                      {u.verificationStatus === "rejected" && (
                        <>
                          <button
                            onClick={() => updateStatus(u._id, "approved")}
                            disabled={actionLoading}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#99cc00] border border-[#99cc00] text-black hover:bg-[#8ab800] active:scale-95 transition-all text-xs font-body font-medium disabled:opacity-50"
                            title="Approve"
                          >
                            <ThumbsUp size={13} />
                            Approve
                          </button>
                          <button
                            onClick={() => updateStatus(u._id, "pending")}
                            disabled={actionLoading}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 hover:bg-amber-500/20 active:scale-95 transition-all text-xs font-body font-medium disabled:opacity-50"
                            title="Move back to pending"
                          >
                            <Undo2 size={13} />
                            Pending
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Rejection reason (if rejected) */}
                  {u.verificationStatus === "rejected" && u.rejectionReason && (
                    <div className="mt-3 pt-3 border-t border-red-500/20">
                      <p className="text-xs text-red-400/80 font-body flex items-start gap-1.5">
                        <AlertCircle size={12} className="mt-0.5 shrink-0" />
                        <span>
                          <span className="font-medium">Rejection reason:</span> {u.rejectionReason}
                        </span>
                      </p>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>

      {/* ═══ DOCUMENT PREVIEW MODAL ═══ */}
      <AnimatePresence>
        {selectedUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            onClick={(e) => {
              if (e.target === e.currentTarget) setSelectedUser(null);
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-3xl max-h-[85vh] overflow-y-auto bg-[#111614] rounded-3xl shadow-2xl border border-white/10"
            >
              {/* Header */}
              <div className="sticky top-0 z-10 bg-[#111614]/90 backdrop-blur-sm border-b border-white/10 px-6 py-4 flex items-center justify-between rounded-t-3xl">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-neutral-800 flex items-center justify-center">
                    <Shield size={18} className="text-[#99cc00]" />
                  </div>
                  <div>
                    <h3 className="font-heading text-lg font-semibold text-white">
                      KYC Documents — {selectedUser.name}
                    </h3>
                    <p className="text-xs text-neutral-400 font-body">{selectedUser.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedUser(null)}
                  className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center text-neutral-400 hover:text-white hover:bg-neutral-700 transition-all"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Side-by-side NIC docs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* NIC Front */}
                  <div>
                    <p className="text-xs font-semibold tracking-wider text-neutral-200 uppercase mb-2 font-body">
                      NIC Front
                    </p>
                    <div
                      className="relative rounded-2xl overflow-hidden bg-neutral-900/60 border border-white/10 h-48 cursor-pointer hover:border-[#99cc00]/40 transition-all"
                      onClick={() => {
                        setPreviewImage(selectedUser.kycDocuments?.nicFront || null);
                        setPreviewLabel("NIC Front");
                      }}
                    >
                      {selectedUser.kycDocuments?.nicFront ? (
                        <img
                          src={selectedUser.kycDocuments.nicFront}
                          alt="NIC Front"
                          className="w-full h-full object-contain p-2"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full text-neutral-500">
                          <ImageIcon size={32} />
                        </div>
                      )}
                    </div>
                  </div>
                  {/* NIC Back */}
                  <div>
                    <p className="text-xs font-semibold tracking-wider text-neutral-200 uppercase mb-2 font-body">
                      NIC Back
                    </p>
                    <div
                      className="relative rounded-2xl overflow-hidden bg-neutral-900/60 border border-white/10 h-48 cursor-pointer hover:border-[#99cc00]/40 transition-all"
                      onClick={() => {
                        setPreviewImage(selectedUser.kycDocuments?.nicBack || null);
                        setPreviewLabel("NIC Back");
                      }}
                    >
                      {selectedUser.kycDocuments?.nicBack ? (
                        <img
                          src={selectedUser.kycDocuments.nicBack}
                          alt="NIC Back"
                          className="w-full h-full object-contain p-2"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full text-neutral-500">
                          <ImageIcon size={32} />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Live Photo */}
                <div>
                  <p className="text-xs font-semibold tracking-wider text-neutral-200 uppercase mb-2 font-body">
                    Live Photo (Selfie)
                  </p>
                  <div
                    className="relative rounded-2xl overflow-hidden bg-neutral-900/60 border border-white/10 h-48 cursor-pointer hover:border-[#99cc00]/40 transition-all"
                    onClick={() => {
                      setPreviewImage(selectedUser.kycDocuments?.livePhoto || null);
                      setPreviewLabel("Live Photo");
                    }}
                  >
                    {selectedUser.kycDocuments?.livePhoto ? (
                      <img
                        src={selectedUser.kycDocuments.livePhoto}
                        alt="Live Photo"
                        className="w-full h-full object-contain p-2"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-neutral-500">
                        <ImageIcon size={32} />
                      </div>
                    )}
                  </div>
                </div>

                {/* Live Video */}
                <div>
                  <p className="text-xs font-semibold tracking-wider text-neutral-200 uppercase mb-2 font-body">
                    5-Second Live Video
                  </p>
                  <div className="rounded-2xl overflow-hidden bg-black border border-white/10">
                    {selectedUser.kycDocuments?.liveVideo ? (
                      <video
                        src={selectedUser.kycDocuments.liveVideo}
                        controls
                        className="w-full h-48 object-contain bg-black"
                      />
                    ) : (
                      <div className="h-48 flex items-center justify-center text-white/30">
                        <Video size={32} />
                      </div>
                    )}
                  </div>
                </div>

                {/* Dynamic Action buttons in modal */}
                <div className="flex items-center gap-3 pt-2">
                  {selectedUser.verificationStatus === "approved" ? (
                    <>
                      <button
                        onClick={() => updateStatus(selectedUser._id, "pending")}
                        disabled={actionLoading}
                        className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-full text-sm font-body font-medium hover:bg-amber-500/20 active:scale-95 transition-all duration-200 disabled:opacity-60"
                      >
                        {actionLoading ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <Undo2 size={16} />
                        )}
                        Move to Pending
                      </button>
                      <button
                        onClick={() => updateStatus(selectedUser._id, "rejected")}
                        disabled={actionLoading}
                        className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-full text-sm font-body font-medium hover:bg-red-500/20 active:scale-95 transition-all duration-200 disabled:opacity-60"
                      >
                        <ThumbsDown size={16} />
                        Reject
                      </button>
                    </>
                  ) : selectedUser.verificationStatus === "rejected" ? (
                    <>
                      <button
                        onClick={() => updateStatus(selectedUser._id, "approved")}
                        disabled={actionLoading}
                        className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 bg-[#99cc00] text-black rounded-full text-sm font-body font-medium hover:bg-[#8ab800] active:scale-95 transition-all duration-200 disabled:opacity-60"
                      >
                        {actionLoading ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <ThumbsUp size={16} />
                        )}
                        Approve
                      </button>
                      <button
                        onClick={() => updateStatus(selectedUser._id, "pending")}
                        disabled={actionLoading}
                        className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-full text-sm font-body font-medium hover:bg-amber-500/20 active:scale-95 transition-all duration-200 disabled:opacity-60"
                      >
                        <Undo2 size={16} />
                        Move to Pending
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => updateStatus(selectedUser._id, "approved")}
                        disabled={actionLoading}
                        className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 bg-[#99cc00] text-black rounded-full text-sm font-body font-medium hover:bg-[#8ab800] active:scale-95 transition-all duration-200 disabled:opacity-60"
                      >
                        {actionLoading ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <ThumbsUp size={16} />
                        )}
                        Approve
                      </button>
                      <button
                        onClick={() => updateStatus(selectedUser._id, "rejected")}
                        disabled={actionLoading}
                        className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-full text-sm font-body font-medium hover:bg-red-500/20 active:scale-95 transition-all duration-200 disabled:opacity-60"
                      >
                        <ThumbsDown size={16} />
                        Reject
                      </button>
                    </>
                  )}
                </div>

                {/* Rejection reason in modal */}
                {selectedUser.verificationStatus === "rejected" && selectedUser.rejectionReason && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4">
                    <p className="text-xs text-red-400/80 font-body flex items-start gap-2">
                      <AlertCircle size={13} className="mt-0.5 shrink-0 text-red-400" />
                      <span>
                        <span className="font-semibold">Rejection reason:</span>{" "}
                        {selectedUser.rejectionReason}
                      </span>
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ IMAGE PREVIEW OVERLAY ═══ */}
      <AnimatePresence>
        {previewImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md"
            onClick={() => { setPreviewImage(null); setPreviewLabel(""); }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative max-w-2xl max-h-[85vh]"
            >
              <div className="absolute -top-8 left-0 text-white/70 text-xs font-body font-medium">
                {previewLabel}
              </div>
              <img
                src={previewImage}
                alt={previewLabel}
                className="w-full h-auto max-h-[80vh] object-contain rounded-2xl shadow-2xl"
              />
              <button
                onClick={() => { setPreviewImage(null); setPreviewLabel(""); }}
                className="absolute -top-10 right-0 w-8 h-8 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/20 transition-all"
              >
                <X size={16} />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ REJECT MODAL ═══ */}
      <AnimatePresence>
        {showRejectModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowRejectModal(false);
                setRejectTarget(null);
              }
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-md bg-[#111614] rounded-3xl shadow-2xl border border-white/10 p-6"
            >
              <h3 className="font-heading text-lg font-semibold text-white mb-2">
                Reject Verification
              </h3>
              <p className="text-sm text-neutral-400 font-body mb-4">
                Provide a reason for rejecting this user&apos;s KYC verification.
              </p>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g. NIC image blurry, mismatched identity..."
                rows={3}
                className="w-full px-4 py-3 bg-neutral-800/80 border border-neutral-700 rounded-xl text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:border-[#99cc00] focus:bg-neutral-800 transition-all font-body resize-none mb-4"
              />
              <div className="flex items-center gap-3">
                <button
                  onClick={() => { setShowRejectModal(false); setRejectTarget(null); setRejectReason(""); }}
                  disabled={actionLoading}
                  className="flex-1 px-5 py-2.5 border border-white/10 text-neutral-300 rounded-full text-sm font-body font-medium hover:bg-white/5 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRejectSubmit}
                  disabled={!rejectReason.trim() || actionLoading}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-full text-sm font-body font-medium hover:bg-red-500/20 active:scale-95 transition-all duration-200 disabled:opacity-60"
                >
                  {actionLoading ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <XCircle size={16} />
                  )}
                  Reject
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
