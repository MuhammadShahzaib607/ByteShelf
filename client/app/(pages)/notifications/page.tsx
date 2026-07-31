"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
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
  Package,
  ShieldAlert,
  Warehouse,
  CheckCheck,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  fetchNotifications,
  readAllNotifications,
  deleteNotifications,
} from "@/redux/slices/notificationSlice";
import type { Notification } from "@/redux/slices/notificationSlice";

// ─── Category helpers ───────────────────────────────────────────────────────────

type Category = "order" | "security" | "warehouse" | "system";

function getCategory(message: string): Category {
  const m = message.toLowerCase();
  if (/(booking|order|payment|paid|invoice|inbound|pickup|deliver)/.test(m))
    return "order";
  if (/(verif|login|password|otp|security|account|credential)/.test(m))
    return "security";
  if (/(warehouse|shelf|inventory|carton|space|stock|alert)/.test(m))
    return "warehouse";
  return "system";
}

const categoryConfig: Record<
  Category,
  { icon: typeof Package; label: string; iconClass: string; boxClass: string }
> = {
  order: {
    icon: Package,
    label: "Order",
    iconClass: "text-[#D0F219]",
    boxClass: "bg-lime-400/10 border border-lime-500/20",
  },
  security: {
    icon: ShieldAlert,
    label: "Security",
    iconClass: "text-sky-400",
    boxClass: "bg-sky-400/10 border border-sky-500/20",
  },
  warehouse: {
    icon: Warehouse,
    label: "Warehouse Alert",
    iconClass: "text-amber-400",
    boxClass: "bg-amber-400/10 border border-amber-500/20",
  },
  system: {
    icon: Bell,
    label: "System",
    iconClass: "text-slate-300",
    boxClass: "bg-white/[0.06] border border-slate-700/60",
  },
};

// ─── Filter tabs ────────────────────────────────────────────────────────────────

type FilterTab = "all" | "unread" | "system";

const filterTabs: { value: FilterTab; label: string }[] = [
  { value: "all", label: "All" },
  { value: "unread", label: "Unread" },
  { value: "system", label: "System" },
];

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
  const category = getCategory(notification.message);
  const cfg = categoryConfig[category];
  const CategoryIcon = cfg.icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className={`group relative flex items-start gap-3 px-4 py-4 rounded-2xl border transition-all duration-200 ${
        isUnread
          ? "bg-[#D0F219]/[0.04] border-l-4 border-l-[#D0F219] border-lime-500/20 shadow-[inset_0_0_30px_rgba(208,242,25,0.03)]"
          : "bg-white/[0.02] border-slate-800/80"
      } ${isSelected ? "ring-2 ring-[#D0F219]/30 shadow-sm" : ""}`}
    >
      {/* Checkbox */}
      <div className="flex items-center pt-0.5">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onToggleSelect}
          className="w-4 h-4 rounded border-slate-600 text-[#D0F219] focus:ring-[#D0F219]/30 cursor-pointer accent-[#D0F219] bg-transparent"
        />
      </div>

      {/* Icon */}
      <div className="shrink-0 pt-0.5 relative">
        <div
          className={`w-8 h-8 rounded-xl flex items-center justify-center ${
            isUnread
              ? `${cfg.boxClass} shadow-[0_0_14px_rgba(208,242,25,0.15)]`
              : "bg-white/[0.04] border border-slate-700/60"
          }`}
        >
          <CategoryIcon
            size={15}
            className={isUnread ? cfg.iconClass : "text-slate-500"}
          />
        </div>
        {/* Unread glowing dot */}
        {isUnread && (
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#D0F219] shadow-[0_0_10px_rgba(208,242,25,0.9)]" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span
            className={`text-[10px] uppercase tracking-wider font-semibold font-body ${
              isUnread ? cfg.iconClass : "text-slate-500"
            }`}
          >
            {cfg.label}
          </span>
          {isUnread && (
            <span className="text-[9px] uppercase tracking-wider font-bold text-[#D0F219] bg-lime-400/10 border border-lime-500/25 px-1.5 py-px rounded-full font-body">
              New
            </span>
          )}
        </div>
        <p
          className={`text-sm font-body leading-relaxed mt-0.5 ${
            isUnread ? "font-semibold text-white" : "text-slate-400"
          }`}
        >
          {notification.message}
        </p>
        <div className="flex items-center gap-2 mt-1.5">
          <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 font-body">
            <Clock size={11} />
            {timeAgo(notification.createdAt)}
          </span>
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

  // ─── Filter state ────────────────────────────────────────────────────────
  const [filter, setFilter] = useState<FilterTab>("all");

  // ─── Auth guard ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (isCheckingAuth) return;
    if (!accessToken) router.replace("/login");
  }, [accessToken, isCheckingAuth, router]);

  // ─── Fetch notifications on mount ────────────────────────────────────────
  useEffect(() => {
    if (!accessToken) return;
    (async () => {
      // Fetch first so the list renders, then auto-mark everything as read.
      // The readAllNotifications.fulfilled reducer flips every item to
      // isRead: true and zeroes `unread`, clearing the Navbar bell badge
      // instantly and re-rendering the list as read.
      const result = await dispatch(fetchNotifications());
      if (fetchNotifications.fulfilled.match(result)) {
        dispatch(readAllNotifications());
      }
    })();
  }, [accessToken, dispatch]);

  // ─── Auto-clear success message ──────────────────────────────────────────
  useEffect(() => {
    if (!deleteSuccess) return;
    const t = setTimeout(() => setDeleteSuccess(false), 3000);
    return () => clearTimeout(t);
  }, [deleteSuccess]);

  // ─── Filtered list (All / Unread / System) ───────────────────────────────
  const filtered = useMemo(() => {
    if (filter === "unread")
      return notifications.filter((n) => !n.isRead);
    if (filter === "system")
      return notifications.filter((n) => getCategory(n.message) === "system");
    return notifications;
  }, [filter, notifications]);

  // ─── Select / Deselect All (scoped to current filter) ────────────────────
  const allSelected =
    filtered.length > 0 && selectedIds.length === filtered.length;
  const handleSelectAll = useCallback(() => {
    if (allSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filtered.map((n) => n._id));
    }
  }, [allSelected, filtered]);

  // ─── Toggle single selection ─────────────────────────────────────────────
  const handleToggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id)
        ? prev.filter((i) => i !== id)
        : [...prev, id]
    );
  }, []);

  // ─── Mark all as read ────────────────────────────────────────────────────
  const handleMarkAllRead = useCallback(async () => {
    if (unread === 0) return;
    await dispatch(readAllNotifications());
    // Everything is now read — clear the selection so stale ids (e.g. on the
    // Unread tab) don't keep the Delete button armed above an empty list.
    setSelectedIds([]);
  }, [unread, dispatch]);

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
      <div className="min-h-screen bg-[#0D0F0A] pt-28 pb-20 px-4 sm:px-6">
        <div className="max-w-2xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-white/[0.06] rounded-lg w-40" />
            <div className="h-4 bg-white/[0.06] rounded w-64" />
            <div className="h-20 bg-white/[0.04] rounded-2xl border border-slate-800/80" />
            <div className="h-20 bg-white/[0.04] rounded-2xl border border-slate-800/80" />
            <div className="h-20 bg-white/[0.04] rounded-2xl border border-slate-800/80" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0D0F0A] pt-28 pb-20">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        {/* Back Button */}
        <motion.button
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => router.back()}
          className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-[#D0F219] font-body transition-colors mb-6"
        >
          <ChevronLeft size={16} />
          Back
        </motion.button>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="mb-6"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-lime-400/10 border border-lime-500/20 flex items-center justify-center">
              <Bell size={20} className="text-[#D0F219]" />
            </div>
            <div>
              <h1 className="font-heading text-2xl sm:text-3xl font-bold text-white tracking-tight">
                Notifications
              </h1>
              <p className="text-sm text-slate-400 font-body mt-0.5">
                {total > 0
                  ? `${total} total · ${read} read · ${unread} unread`
                  : "Stay updated with your activity"}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Filter Pills */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
          className="flex items-center gap-1 p-1 rounded-2xl bg-white/[0.03] border border-slate-800/80 w-fit mb-5"
        >
          {filterTabs.map((tab) => {
            const isActive = filter === tab.value;
            const count =
              tab.value === "all"
                ? total
                : tab.value === "unread"
                ? unread
                : notifications.filter(
                    (n) => getCategory(n.message) === "system"
                  ).length;
            return (
              <button
                key={tab.value}
                onClick={() => setFilter(tab.value)}
                className={`relative px-4 py-1.5 rounded-xl text-xs font-body font-medium transition-colors duration-200 ${
                  isActive
                    ? "text-[#12140E]"
                    : "text-slate-400 hover:text-[#D0F219]"
                }`}
              >
                {isActive && (
                  <motion.span
                    layoutId="notification-filter-pill"
                    transition={{ type: "spring", stiffness: 400, damping: 32 }}
                    className="absolute inset-0 rounded-xl bg-[#D0F219] shadow-[0_0_16px_rgba(208,242,25,0.35)]"
                  />
                )}
                <span className="relative z-10 inline-flex items-center gap-1.5">
                  {tab.label}
                  {count > 0 && (
                    <span
                      className={`text-[10px] font-bold ${
                        isActive
                          ? "text-[#12140E]/60"
                          : "text-slate-500"
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </motion.div>

        {/* Success Toast */}
        <AnimatePresence>
          {deleteSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="mb-4 p-3 rounded-xl bg-[#D0F219]/10 border border-lime-500/30 flex items-center gap-2.5"
            >
              <CheckCircle size={15} className="text-[#D0F219] shrink-0" />
              <p className="text-xs text-lime-200 font-body">
                Notification(s) deleted successfully.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Delete Error */}
        {deleteError && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-2.5">
            <AlertCircle size={14} className="text-red-400 shrink-0 mt-0.5" />
            <p className="text-xs text-red-300 font-body">{deleteError}</p>
          </div>
        )}

        {/* Select All, Mark Read & Delete Bar */}
        {notifications.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="flex flex-wrap items-center justify-between gap-3 mb-5 p-3 rounded-2xl bg-white/[0.03] border border-slate-800/80"
          >
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={handleSelectAll}
                  className="w-4 h-4 rounded border-slate-600 text-[#D0F219] focus:ring-[#D0F219]/30 cursor-pointer accent-[#D0F219] bg-transparent"
                />
                <span className="text-sm font-medium text-slate-200 font-body">
                  Select All
                </span>
                {selectedIds.length > 0 && (
                  <span className="text-xs text-slate-500 font-body">
                    ({selectedIds.length} selected)
                  </span>
                )}
              </label>

              <button
                onClick={handleMarkAllRead}
                disabled={unread === 0}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-body font-medium transition-all duration-200 ${
                  unread === 0
                    ? "bg-white/[0.02] text-slate-600 border border-slate-800/80 cursor-not-allowed"
                    : "bg-lime-400/10 text-[#D0F219] border border-lime-500/30 hover:bg-lime-400/20 hover:shadow-[0_0_16px_rgba(208,242,25,0.2)] active:scale-[0.97]"
                }`}
              >
                <CheckCheck size={13} />
                Mark all as read
              </button>
            </div>

            <button
              onClick={handleDeleteSelected}
              disabled={selectedIds.length === 0 || isDeleting}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-body font-medium transition-all duration-200 ${
                selectedIds.length === 0
                  ? "bg-white/[0.02] text-slate-600 border border-slate-800/80 cursor-not-allowed"
                  : "bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20 active:scale-[0.97]"
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
        {!loading && filtered.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="text-center py-20"
          >
            <div className="w-16 h-16 rounded-2xl bg-white/[0.03] flex items-center justify-center mx-auto mb-4 border border-slate-800/80">
              <BellOff size={28} className="text-slate-600" />
            </div>
            <h2 className="font-heading text-xl font-semibold text-white mb-1">
              {filter === "unread"
                ? "You're all caught up"
                : filter === "system"
                ? "No system notifications"
                : "No notifications yet"}
            </h2>
            <p className="text-sm text-slate-400 font-body max-w-xs mx-auto">
              {filter === "unread"
                ? "No unread notifications right now. New activity will appear here."
                : filter === "system"
                ? "System updates and platform announcements will appear here."
                : "When you receive notifications about bookings, payments, and activity, they will appear here."}
            </p>
          </motion.div>
        )}

        {/* Notification List */}
        <AnimatePresence mode="popLayout">
          {filtered.map((notification) => (
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
            <Loader2 size={20} className="animate-spin text-[#D0F219]" />
          </div>
        )}
      </div>
    </div>
  );
}
