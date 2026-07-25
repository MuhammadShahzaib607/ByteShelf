"use client";

import { useState, useEffect, useCallback } from "react";
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
} from "lucide-react";
import { useAppSelector } from "@/redux/hooks";
import api from "@/lib/axios";

// ─── Types ──────────────────────────────────────────────────────────────────────

interface PendingUser {
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

// ═══════════════════════════════════════════════════════════════════════════════
// PAGE
// ═══════════════════════════════════════════════════════════════════════════════

export default function AdminVerificationsPage() {
  const router = useRouter();
  const { user, accessToken, isCheckingAuth } = useAppSelector((state) => state.auth);

  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ─── Preview modal state ────────────────────────────────────────────────
  const [selectedUser, setSelectedUser] = useState<PendingUser | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [previewLabel, setPreviewLabel] = useState("");

  // ─── Reject modal state ─────────────────────────────────────────────────
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // ─── Auth guard ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (isCheckingAuth) return;
    if (!accessToken) router.replace("/login");
    else if (user?.role !== "admin") router.replace("/explore");
  }, [accessToken, user, isCheckingAuth, router]);

  // ─── Fetch pending verifications ─────────────────────────────────────────
  const fetchPending = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get("/admin/pending-verifications");
      setPendingUsers(res.data.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load pending verifications");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!accessToken || user?.role !== "admin") return;
    fetchPending();
  }, [accessToken, user, fetchPending]);

  // ─── Handle approve ─────────────────────────────────────────────────────
  const handleApprove = useCallback(async (userId: string) => {
    setActionLoading(true);
    try {
      await api.patch(`/admin/verify-user/${userId}`, { status: "approved" });
      setPendingUsers((prev) => prev.filter((u) => u._id !== userId));
      setSelectedUser(null);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to approve user");
    } finally {
      setActionLoading(false);
    }
  }, []);

  // ─── Handle reject ──────────────────────────────────────────────────────
  const handleReject = useCallback(async () => {
    if (!rejectTarget || !rejectReason.trim()) return;
    setActionLoading(true);
    try {
      await api.patch(`/admin/verify-user/${rejectTarget}`, {
        status: "rejected",
        reason: rejectReason.trim(),
      });
      setPendingUsers((prev) => prev.filter((u) => u._id !== rejectTarget));
      setShowRejectModal(false);
      setRejectTarget(null);
      setRejectReason("");
      setSelectedUser(null);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to reject user");
    } finally {
      setActionLoading(false);
    }
  }, [rejectTarget, rejectReason]);

  // ─── Open reject modal ──────────────────────────────────────────────────
  const openReject = (userId: string) => {
    setRejectTarget(userId);
    setShowRejectModal(true);
  };

  // ─── Format date ─────────────────────────────────────────────────────────
  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" });

  if (isCheckingAuth || loading) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] pt-28 pb-20 px-4 sm:px-6 flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-[#0284C7]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] pt-28 pb-20 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8"
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold uppercase tracking-wider border border-slate-200/50">
              Admin
            </div>
          </div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold text-[#1E293B] tracking-tight">
            KYC Verifications
          </h1>
          <p className="mt-1 text-sm text-[#0F172A]/50 font-body">
            Review and approve/reject pending user verification requests
          </p>
        </motion.div>

        {/* Error Banner */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 flex items-center gap-3"
            >
              <AlertCircle size={18} className="text-red-500 shrink-0" />
              <p className="text-sm text-red-700 font-body">{error}</p>
              <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600">
                <X size={16} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Count badge */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-2 mb-6 text-sm text-[#0F172A]/50 font-body"
        >
          <Clock size={14} />
          <span>{pendingUsers.length} pending verification{pendingUsers.length !== 1 ? "s" : ""}</span>
        </motion.div>

        {/* Empty */}
        {pendingUsers.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center mx-auto mb-4 shadow-sm">
              <CheckCircle size={28} className="text-emerald-400" />
            </div>
            <h3 className="font-heading text-lg font-semibold text-[#1E293B] mb-2">
              All caught up!
            </h3>
            <p className="text-sm text-[#0F172A]/50 font-body max-w-sm mx-auto">
              No pending KYC verification requests at the moment.
            </p>
          </motion.div>
        )}

        {/* Users List */}
        {pendingUsers.length > 0 && (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0 },
              visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
            }}
            className="space-y-4"
          >
            {pendingUsers.map((pu) => (
              <motion.div
                key={pu._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/80 backdrop-blur-xl border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-3xl p-6"
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
                  {/* Avatar */}
                  <div className="w-12 h-12 rounded-2xl bg-[#1E293B] flex items-center justify-center shrink-0">
                    <User size={20} className="text-white" />
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-heading text-lg font-semibold text-[#1E293B] truncate">
                      {pu.name}
                    </h3>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-[#0F172A]/50 font-body">
                      <span className="flex items-center gap-1">
                        <Mail size={11} />
                        {pu.email}
                      </span>
                      <span className="capitalize">Role: {pu.role}</span>
                      <span className="flex items-center gap-1">
                        <CalendarDays size={11} />
                        {formatDate(pu.createdAt)}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setSelectedUser(pu)}
                      className="px-4 py-2 bg-slate-900 text-white rounded-full text-xs font-body font-medium hover:bg-slate-800 hover:shadow-lg hover:shadow-slate-900/20 active:scale-95 transition-all duration-200"
                    >
                      Review Docs
                    </button>
                    <button
                      onClick={() => handleApprove(pu._id)}
                      disabled={actionLoading}
                      className="p-2 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 hover:bg-emerald-100 active:scale-95 transition-all disabled:opacity-50"
                      title="Approve"
                    >
                      <ThumbsUp size={16} />
                    </button>
                    <button
                      onClick={() => openReject(pu._id)}
                      disabled={actionLoading}
                      className="p-2 rounded-full bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 active:scale-95 transition-all disabled:opacity-50"
                      title="Reject"
                    >
                      <ThumbsDown size={16} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
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
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
            onClick={(e) => {
              if (e.target === e.currentTarget) setSelectedUser(null);
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-3xl max-h-[85vh] overflow-y-auto bg-white rounded-3xl shadow-2xl border border-slate-200/60"
            >
              {/* Header */}
              <div className="sticky top-0 z-10 bg-white/90 backdrop-blur-sm border-b border-slate-200/60 px-6 py-4 flex items-center justify-between rounded-t-3xl">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#F8FAFC] flex items-center justify-center">
                    <Shield size={18} className="text-[#0284C7]" />
                  </div>
                  <div>
                    <h3 className="font-heading text-lg font-semibold text-[#1E293B]">
                      KYC Documents — {selectedUser.name}
                    </h3>
                    <p className="text-xs text-[#0F172A]/50 font-body">{selectedUser.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedUser(null)}
                  className="w-8 h-8 rounded-full bg-[#F8FAFC] flex items-center justify-center text-[#0F172A]/50 hover:text-[#0F172A] hover:bg-[#F1F5F9] transition-all"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Side-by-side NIC docs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* NIC Front */}
                  <div>
                    <p className="text-xs font-semibold tracking-wider text-[#1E293B] uppercase mb-2 font-body">
                      NIC Front
                    </p>
                    <div
                      className="relative rounded-2xl overflow-hidden bg-[#F8FAFC] border border-slate-200/60 h-48 cursor-pointer hover:border-[#0284C7]/30 transition-all"
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
                        <div className="flex items-center justify-center h-full text-[#0F172A]/30">
                          <ImageIcon size={32} />
                        </div>
                      )}
                    </div>
                  </div>
                  {/* NIC Back */}
                  <div>
                    <p className="text-xs font-semibold tracking-wider text-[#1E293B] uppercase mb-2 font-body">
                      NIC Back
                    </p>
                    <div
                      className="relative rounded-2xl overflow-hidden bg-[#F8FAFC] border border-slate-200/60 h-48 cursor-pointer hover:border-[#0284C7]/30 transition-all"
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
                        <div className="flex items-center justify-center h-full text-[#0F172A]/30">
                          <ImageIcon size={32} />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Live Photo */}
                <div>
                  <p className="text-xs font-semibold tracking-wider text-[#1E293B] uppercase mb-2 font-body">
                    Live Photo (Selfie)
                  </p>
                  <div
                    className="relative rounded-2xl overflow-hidden bg-[#F8FAFC] border border-slate-200/60 h-48 cursor-pointer hover:border-[#0284C7]/30 transition-all"
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
                      <div className="flex items-center justify-center h-full text-[#0F172A]/30">
                        <ImageIcon size={32} />
                      </div>
                    )}
                  </div>
                </div>

                {/* Live Video */}
                <div>
                  <p className="text-xs font-semibold tracking-wider text-[#1E293B] uppercase mb-2 font-body">
                    5-Second Live Video
                  </p>
                  <div className="rounded-2xl overflow-hidden bg-black border border-slate-200/60">
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

                {/* Action buttons */}
                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={() => handleApprove(selectedUser._id)}
                    disabled={actionLoading}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 bg-emerald-600 text-white rounded-full text-sm font-body font-medium hover:bg-emerald-700 active:scale-95 transition-all duration-200 disabled:opacity-60"
                  >
                    {actionLoading ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <ThumbsUp size={16} />
                    )}
                    Approve
                  </button>
                  <button
                    onClick={() => openReject(selectedUser._id)}
                    disabled={actionLoading}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 bg-red-50 border border-red-200 text-red-600 rounded-full text-sm font-body font-medium hover:bg-red-100 active:scale-95 transition-all duration-200 disabled:opacity-60"
                  >
                    <ThumbsDown size={16} />
                    Reject
                  </button>
                </div>
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
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
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
              className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200/60 p-6"
            >
              <h3 className="font-heading text-lg font-semibold text-[#1E293B] mb-2">
                Reject Verification
              </h3>
              <p className="text-sm text-[#0F172A]/60 font-body mb-4">
                Provide a reason for rejecting this user&apos;s KYC verification.
              </p>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g. NIC image blurry, mismatched identity..."
                rows={3}
                className="w-full px-4 py-3 bg-[#F8FAFC]/40 border border-slate-200 rounded-xl text-sm text-[#0F172A] placeholder:text-[#0F172A]/30 focus:outline-none focus:border-[#0284C7] focus:bg-white transition-all font-body resize-none mb-4"
              />
              <div className="flex items-center gap-3">
                <button
                  onClick={() => { setShowRejectModal(false); setRejectTarget(null); setRejectReason(""); }}
                  disabled={actionLoading}
                  className="flex-1 px-5 py-2.5 border border-slate-200 text-slate-700 rounded-full text-sm font-body font-medium hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReject}
                  disabled={!rejectReason.trim() || actionLoading}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-red-600 text-white rounded-full text-sm font-body font-medium hover:bg-red-700 active:scale-95 transition-all duration-200 disabled:opacity-60"
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
