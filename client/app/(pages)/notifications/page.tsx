"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  BellOff,
  Loader2,
  CheckCircle,
  Trash2,
  AlertCircle,
  ChevronLeft,
  Clock,
  ExternalLink,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  fetchNotifications,
  readAllNotifications,
  deleteNotifications,
} from "@/redux/slices/notificationSlice";
import type { Notification } from "@/redux/slices/notificationSlice";

// ─── Helpers ────────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const diffMs = now - date;
  const seconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);

  if (seconds < 60) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  if (weeks < 4) return `${weeks}w ago`;
  return `${months}mo ago`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// NOTIFICATION CARD
// ═══════════════════════════════════════════════════════════════════════════════

function NotificationCard({
  notification,
  isSelected,
  onToggleSelect,
}: {
  notification: Notification;
  isSelected: boolean;
  onToggleSelect: () => void;
}) {
  const isUnread = !notification.isRead;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className={`group relative flex items-start gap-3 px-4 py-4 rounded-2xl border transition-all duration-200 ${
        isUnread
          ? "bg-[#F8FAFC] border-l-4 border-l-[#0284C7] border-[#E2E8F0]"
          : "bg-white border-[#E2E8F0]"
      } ${isSelected ? "ring-2 ring-[#0284C7]/30 shadow-sm" : ""}`}
    >
      {/* Checkbox */}
      <div className="flex items-center pt-0.5">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onToggleSelect}
          className="w-4 h-4 rounded border-[#CBD5E1] text-[#0284C7] focus:ring-[#0284C7]/30 cursor-pointer accent-[#0284C7]"
        />
      </div>

      {/* Icon */}
      <div className="shrink-0 pt-0.5">
        <div
          className={`w-8 h-8 rounded-xl flex items-center justify-center ${
            isUnread ? "bg-[#0284C7]/10" : "bg-[#F8FAFC]"
          }`}
        >
          <Bell
            size={15}
            className={isUnread ? "text-[#0284C7]" : "text-[#0F172A]/30"}
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p
          className={`text-sm font-body leading-relaxed ${
            isUnread
              ? "font-semibold text-[#1E293B]"
              : "text-[#0F172A]/70"
          }`}
        >
          {notification.message}
        </p>
        <div className="flex items-center gap-2 mt-1.5">
          <span className="inline-flex items-center gap-1 text-[11px] text-[#0F172A]/40 font-body">
            <Clock size={11} />
            {timeAgo(notification.createdAt)}
          </span>
          {/* {notification.link && (
            <a
              href={notification.link}
              className="inline-flex items-center gap-1 text-[11px] text-[#0284C7] hover:underline font-body"
            >
              <ExternalLink size={10} />
              View
            </a>
          )} */}
        </div>
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PAGE
// ═══════════════════════════════════════════════════════════════════════════════

export default function NotificationsPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { accessToken, isCheckingAuth } = useAppSelector(
    (state) => state.auth
  );
  const { notifications, total, read, unread, loading } = useAppSelector(
    (state) => state.notifications
  );

  // ─── Selection state ─────────────────────────────────────────────────────
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteSuccess, setDeleteSuccess] = useState(false);

  // ─── Auth guard ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (isCheckingAuth) return;
    if (!accessToken) router.replace("/login");
  }, [accessToken, isCheckingAuth, router]);

  // ─── Fetch notifications on mount ────────────────────────────────────────
  useEffect(() => {
    if (!accessToken) return;
    dispatch(fetchNotifications());
  }, [accessToken, dispatch]);

  // ─── Auto mark all unread as read when page is visited ───────────────────
  useEffect(() => {
    if (!accessToken || unread === 0) return;
    dispatch(readAllNotifications());
  }, [accessToken, unread, dispatch]);

  // ─── Auto-clear success message ──────────────────────────────────────────
  useEffect(() => {
    if (!deleteSuccess) return;
    const t = setTimeout(() => setDeleteSuccess(false), 3000);
    return () => clearTimeout(t);
  }, [deleteSuccess]);

  // ─── Select / Deselect All ───────────────────────────────────────────────
  const allSelected =
    notifications.length > 0 && selectedIds.length === notifications.length;
  const handleSelectAll = useCallback(() => {
    if (allSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(notifications.map((n) => n._id));
    }
  }, [allSelected, notifications]);

  // ─── Toggle single selection ─────────────────────────────────────────────
  const handleToggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id)
        ? prev.filter((i) => i !== id)
        : [...prev, id]
    );
  }, []);

  // ─── Bulk delete ─────────────────────────────────────────────────────────
  const handleDeleteSelected = useCallback(async () => {
    if (selectedIds.length === 0) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      const resultAction = await dispatch(deleteNotifications(selectedIds));
      if (deleteNotifications.fulfilled.match(resultAction)) {
        setSelectedIds([]);
        setDeleteSuccess(true);
      } else {
        setDeleteError(
          (resultAction.payload as string) || "Failed to delete notifications."
        );
      }
    } finally {
      setIsDeleting(false);
    }
  }, [selectedIds, dispatch]);

  // ─── Loading state ───────────────────────────────────────────────────────
  if (loading && notifications.length === 0) {
    return (
      <div className="min-h-screen bg-white pt-28 pb-20 px-4 sm:px-6">
        <div className="max-w-2xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-[#F8FAFC] rounded-lg w-40" />
            <div className="h-4 bg-[#F8FAFC] rounded w-64" />
            <div className="h-20 bg-[#F8FAFC] rounded-2xl" />
            <div className="h-20 bg-[#F8FAFC] rounded-2xl" />
            <div className="h-20 bg-[#F8FAFC] rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pt-28 pb-20">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        {/* Back Button */}
        <motion.button
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => router.back()}
          className="inline-flex items-center gap-1.5 text-sm text-[#0F172A]/50 hover:text-[#1E293B] font-body transition-colors mb-6"
        >
          <ChevronLeft size={16} />
          Back
        </motion.button>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-[#F8FAFC] flex items-center justify-center">
              <Bell size={20} className="text-[#0284C7]" />
            </div>
            <div>
              <h1 className="font-heading text-2xl sm:text-3xl font-bold text-[#1E293B] tracking-tight">
                Notifications
              </h1>
              <p className="text-sm text-[#0F172A]/50 font-body mt-0.5">
                {total > 0
                  ? `${total} total · ${read} read · ${unread} unread`
                  : "Stay updated with your activity"}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Success Toast */}
        <AnimatePresence>
          {deleteSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-2.5"
            >
              <CheckCircle size={15} className="text-emerald-500 shrink-0" />
              <p className="text-xs text-emerald-700 font-body">
                Notification(s) deleted successfully.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Delete Error */}
        {deleteError && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2.5">
            <AlertCircle size={14} className="text-red-500 shrink-0 mt-0.5" />
            <p className="text-xs text-red-600 font-body">{deleteError}</p>
          </div>
        )}

        {/* Select All & Delete Bar */}
        {notifications.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="flex items-center justify-between mb-5 p-3 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0]"
          >
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={handleSelectAll}
                className="w-4 h-4 rounded border-[#CBD5E1] text-[#0284C7] focus:ring-[#0284C7]/30 cursor-pointer accent-[#0284C7]"
              />
              <span className="text-sm font-medium text-[#1E293B] font-body">
                Select All
              </span>
              {selectedIds.length > 0 && (
                <span className="text-xs text-[#0F172A]/50 font-body">
                  ({selectedIds.length} selected)
                </span>
              )}
            </label>

            <button
              onClick={handleDeleteSelected}
              disabled={selectedIds.length === 0 || isDeleting}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-body font-medium transition-all duration-200 ${
                selectedIds.length === 0
                  ? "bg-[#F8FAFC] text-[#0F172A]/30 border border-[#E2E8F0] cursor-not-allowed"
                  : "bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 active:scale-[0.97]"
              }`}
            >
              {isDeleting ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <Trash2 size={13} />
              )}
              Delete Selected
            </button>
          </motion.div>
        )}

        {/* Empty State */}
        {!loading && notifications.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="text-center py-20"
          >
            <div className="w-16 h-16 rounded-2xl bg-[#F8FAFC] flex items-center justify-center mx-auto mb-4 border border-[#E2E8F0]">
              <BellOff size={28} className="text-[#0F172A]/20" />
            </div>
            <h2 className="font-heading text-xl font-semibold text-[#1E293B] mb-1">
              No notifications yet
            </h2>
            <p className="text-sm text-[#0F172A]/50 font-body max-w-xs mx-auto">
              When you receive notifications about bookings, payments, and
              activity, they will appear here.
            </p>
          </motion.div>
        )}

        {/* Notification List */}
        <AnimatePresence mode="popLayout">
          {notifications.map((notification) => (
            <div key={notification._id} className="mb-2.5">
              <NotificationCard
                notification={notification}
                isSelected={selectedIds.includes(notification._id)}
                onToggleSelect={() => handleToggleSelect(notification._id)}
              />
            </div>
          ))}
        </AnimatePresence>

        {/* Bottom loading indicator */}
        {loading && notifications.length > 0 && (
          <div className="flex justify-center py-8">
            <Loader2 size={20} className="animate-spin text-[#0284C7]" />
          </div>
        )}
      </div>
    </div>
  );
}
