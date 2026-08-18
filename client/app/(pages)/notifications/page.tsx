"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  BellOff,
  Loader2,
  CheckCheck,
  ChevronRight,
  CalendarDays,
  Scan,
  ShieldCheck,
  Info,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  fetchNotifications,
  markNotificationAsRead,
  readAllNotifications,
} from "@/redux/slices/notificationSlice";
import type { Notification } from "@/redux/slices/notificationSlice";

// ─── Category helpers ───────────────────────────────────────────────────────────

type Category = "booking" | "inbound" | "payment" | "system";

// Bucket a notification by scanning its title + message.
function getCategory(n: Pick<Notification, "title" | "message">): Category {
  const text = `${n.title || ""} ${n.message}`.toLowerCase();
  if (/(booking|confirmed|declined|rejected|cancelled|cancel)/.test(text))
    return "booking";
  if (/(payment|paid|proof|invoice)/.test(text)) return "payment";
  if (/(inbound|dispatch|shipment|order|pickup|deliver|carton)/.test(text))
    return "inbound";
  return "system";
}

// Resolve the colored icon treatment (emerald / amber / rose / sky).
function categoryConfig(category: Category, isUnread: boolean) {
  const base: Record<
    Category,
    {
      icon: typeof CalendarDays;
      label: string;
      iconClass: string;
      boxClass: string;
    }
  > = {
    booking: {
      icon: CalendarDays,
      label: "Booking",
      iconClass: "text-[#84cc16]",
      boxClass: "bg-[#84cc16]/10 border border-[#84cc16]/25 shadow-[0_0_16px_rgba(132,204,22,0.12)]",
    },
    payment: {
      icon: ShieldCheck,
      label: "Payment",
      iconClass: "text-[#84cc16]",
      boxClass: "bg-[#84cc16]/10 border border-[#84cc16]/25 shadow-[0_0_16px_rgba(132,204,22,0.12)]",
    },
    inbound: {
      icon: Scan,
      label: "Inbound & Orders",
      iconClass: "text-amber-400",
      boxClass: "bg-amber-400/10 border border-amber-500/25 shadow-[0_0_16px_rgba(251,191,36,0.12)]",
    },
    system: {
      icon: Info,
      label: "System",
      iconClass: "text-sky-400",
      boxClass: "bg-sky-400/10 border border-sky-500/25 shadow-[0_0_16px_rgba(56,189,248,0.12)]",
    },
  };
  const cfg = base[category];
  return {
    ...cfg,
    // Dim the icon when the notification is already read
    iconClass: isUnread ? cfg.iconClass : "text-slate-500",
    boxClass: isUnread ? cfg.boxClass : "bg-white/[0.04] border border-[#1c241c] shadow-none",
  };
}

// ─── Time helpers ───────────────────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const diffMs = now - date;
  const seconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);

  if (seconds < 60) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  if (weeks < 4) return `${weeks}w ago`;
  return new Date(dateStr).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function isSameDay(a: string, b: string): boolean {
  const da = new Date(a);
  const db = new Date(b);
  return (
    da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate()
  );
}

function yesterdayDate(): Date {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d;
}

// Group notifications into "Today", "Yesterday", "Earlier"
function groupByTimeframe(notifications: Notification[]) {
  const today: Notification[] = [];
  const yesterday: Notification[] = [];
  const earlier: Notification[] = [];

  for (const n of notifications) {
    if (isSameDay(n.createdAt, new Date().toISOString())) today.push(n);
    else if (isSameDay(n.createdAt, yesterdayDate().toISOString()))
      yesterday.push(n);
    else earlier.push(n);
  }
  return [
    { label: "Today", items: today },
    { label: "Yesterday", items: yesterday },
    { label: "Earlier", items: earlier },
  ];
}

// ─── Filter tabs ────────────────────────────────────────────────────────────────

type FilterTab = "all" | "unread" | "bookings" | "inbounds";

const filterTabs: { value: FilterTab; label: string }[] = [
  { value: "all", label: "All" },
  { value: "unread", label: "Unread" },
  { value: "bookings", label: "Bookings" },
  { value: "inbounds", label: "Inbounds & Orders" },
];

// ═══════════════════════════════════════════════════════════════════════════════
// NOTIFICATION CARD
// ═══════════════════════════════════════════════════════════════════════════════

function NotificationCard({
  notification,
  onOpen,
}: {
  notification: Notification;
  onOpen: (n: Notification) => void;
}) {
  const isUnread = !notification.isRead;
  const category = getCategory(notification);
  const cfg = categoryConfig(category, isUnread);
  const CategoryIcon = cfg.icon;

  // Color-coded left accent for unread cards
  const accentByCategory: Record<Category, string> = {
    booking: "border-l-[#84cc16] bg-[#84cc16]/[0.05]",
    payment: "border-l-[#84cc16] bg-[#84cc16]/[0.05]",
    inbound: "border-l-amber-500 bg-amber-500/[0.05]",
    system: "border-l-sky-500 bg-sky-500/[0.05]",
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      onClick={() => onOpen(notification)}
      className={`group relative cursor-pointer rounded-xl border p-4 transition-all duration-200 ${
        isUnread
          ? `border-l-4 ${accentByCategory[category]} bg-[#111611] border-[#1c241c] hover:border-[#2a352a]`
          : "bg-[#111611] border-[#1c241c] hover:border-[#2a352a]"
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Category icon with glow */}
        <div className="shrink-0 pt-0.5 relative">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center ${cfg.boxClass}`}
          >
            <CategoryIcon size={16} className={cfg.iconClass} />
          </div>
          {isUnread && (
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#84cc16] shadow-[0_0_10px_rgba(132,204,22,0.9)]" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`text-[10px] uppercase tracking-wider font-semibold font-body ${
                isUnread ? cfg.iconClass : "text-slate-500"
              }`}
            >
              {cfg.label}
            </span>
            {isUnread && (
              <span className="text-[9px] uppercase tracking-wider font-bold text-[#84cc16] bg-[#84cc16]/10 border border-[#84cc16]/25 px-1.5 py-px rounded-full font-body">
                New
              </span>
            )}
            <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 font-body ml-auto">
              {timeAgo(notification.createdAt)}
            </span>
          </div>

          {notification.title ? (
            <>
              <p
                className={`text-sm font-heading font-semibold leading-snug mt-1 ${
                  isUnread ? "text-white" : "text-slate-300"
                }`}
              >
                {notification.title}
              </p>            <p
              className={`text-[13px] font-body leading-relaxed mt-0.5 ${
                isUnread ? "text-slate-300" : "text-slate-400"
              }`}
            >
              {notification.message}
            </p>
          </>
        ) : (
          <p
            className={`text-sm font-body leading-relaxed mt-1 ${
              isUnread ? "font-semibold text-white" : "text-slate-400"
            }`}
          >
            {notification.message}
          </p>
        )}
        </div>
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PAGE
// ═══════════════════════════════════════════════════════════════════════════════

const PAGE_SIZE = 8;

export default function NotificationsPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { accessToken, isCheckingAuth } = useAppSelector(
    (state) => state.auth
  );
  const { notifications, total, unread, loading } = useAppSelector(
    (state) => state.notifications
  );

  // ─── Local state ──────────────────────────────────────────────────────────
  const [filter, setFilter] = useState<FilterTab>("all");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [isMarkingAll, setIsMarkingAll] = useState(false);

  // ─── Auth guard ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (isCheckingAuth) return;
    if (!accessToken) router.replace("/login");
  }, [accessToken, isCheckingAuth, router]);

  // ─── Fetch on mount ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!accessToken) return;
    dispatch(fetchNotifications());
  }, [accessToken, dispatch]);

  // ─── Filtered list ───────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    switch (filter) {
      case "unread":
        return notifications.filter((n) => !n.isRead);
      case "bookings":
        return notifications.filter(
          (n) => getCategory(n) === "booking" || getCategory(n) === "payment"
        );
      case "inbounds":
        return notifications.filter((n) => getCategory(n) === "inbound");
      default:
        return notifications;
    }
  }, [filter, notifications]);

  // ─── Counts per tab ──────────────────────────────────────────────────────
  const tabCounts = useMemo(
    () => ({
      all: total,
      unread,
      bookings: notifications.filter(
        (n) => getCategory(n) === "booking" || getCategory(n) === "payment"
      ).length,
      inbounds: notifications.filter((n) => getCategory(n) === "inbound")
        .length,
    }),
    [total, unread, notifications]
  );

  // ─── Grouped + paginated ─────────────────────────────────────────────────
  const groups = useMemo(() => {
    const sliced = filtered.slice(0, visibleCount);
    return groupByTimeframe(sliced).filter((g) => g.items.length > 0);
  }, [filtered, visibleCount]);

  const hasMore = visibleCount < filtered.length;

  // ─── Handlers ────────────────────────────────────────────────────────────
  // Clicking a notification only marks it as read — no navigation.
  const handleOpen = useCallback(
    (n: Notification) => {
      if (!n.isRead) dispatch(markNotificationAsRead(n._id));
    },
    [dispatch]
  );

  // Switch filter and reset pagination together
  const handleFilterChange = useCallback((tab: FilterTab) => {
    setFilter(tab);
    setVisibleCount(PAGE_SIZE);
  }, []);

  const handleMarkAllRead = useCallback(async () => {
    if (unread === 0 || isMarkingAll) return;
    setIsMarkingAll(true);
    try {
      await dispatch(readAllNotifications());
    } finally {
      setIsMarkingAll(false);
    }
  }, [unread, isMarkingAll, dispatch]);

  // ─── Loading state ───────────────────────────────────────────────────────
  if (loading && notifications.length === 0) {
    return (
      <div className="min-h-screen bg-[#0D0F0A] pt-28 pb-20 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-white/[0.06] rounded-lg w-56" />
            <div className="h-4 bg-white/[0.06] rounded w-72" />
            <div className="h-24 bg-[#111611] rounded-xl border border-[#1c241c]" />
            <div className="h-24 bg-[#111611] rounded-xl border border-[#1c241c]" />
            <div className="h-24 bg-[#111611] rounded-xl border border-[#1c241c]" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0D0F0A] pt-28 pb-20 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-11 h-11 rounded-xl bg-[#84cc16]/10 border border-[#84cc16]/25 flex items-center justify-center shadow-[0_0_20px_rgba(132,204,22,0.15)]">
              <Bell size={22} className="text-[#84cc16]" />
            </div>
            <div>
              <h1 className="font-heading text-2xl sm:text-3xl font-bold text-white tracking-tight">
                Notifications &amp; Alerts
              </h1>
              <p className="text-sm text-slate-400 font-body mt-0.5">
                Stay updated on your warehouse bookings, inbound shipments, and
                dispatch requests.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Actions bar: filter tabs + mark all */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
          className="flex flex-wrap items-center justify-between gap-3 mb-6"
        >
          <div className="flex items-center gap-1 p-1 rounded-2xl bg-white/[0.03] border border-[#1c241c] w-fit">
            {filterTabs.map((tab) => {
              const isActive = filter === tab.value;
              const count = tabCounts[tab.value];
              return (
                <button
                  key={tab.value}
                  onClick={() => handleFilterChange(tab.value)}
                  className={`relative px-3.5 py-1.5 rounded-xl text-xs font-body font-medium transition-colors duration-200 ${
                    isActive
                      ? "text-[#0D0F0A]"
                      : "text-slate-400 hover:text-[#84cc16]"
                  }`}
                >
                  {isActive && (
                    <motion.span
                      layoutId="notification-filter-pill"
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 32,
                      }}
                      className="absolute inset-0 rounded-xl bg-[#84cc16] shadow-[0_0_16px_rgba(132,204,22,0.35)]"
                    />
                  )}
                  <span className="relative z-10 inline-flex items-center gap-1.5">
                    {tab.label}
                    {count > 0 && (
                      <span
                        className={`text-[10px] font-bold ${
                          isActive ? "text-[#0D0F0A]/60" : "text-slate-500"
                        }`}
                      >
                        {count}
                      </span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>

          <button
            onClick={handleMarkAllRead}
            disabled={unread === 0 || isMarkingAll}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-body font-medium transition-all duration-200 ${
              unread === 0
                ? "bg-white/[0.02] text-slate-600 border border-[#1c241c] cursor-not-allowed"
                : "bg-[#84cc16]/10 text-[#84cc16] border border-[#84cc16]/30 hover:bg-[#84cc16]/20 hover:shadow-[0_0_16px_rgba(132,204,22,0.2)] active:scale-[0.97]"
            }`}
          >
            {isMarkingAll ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <CheckCheck size={13} />
            )}
            Mark All as Read
          </button>
        </motion.div>

        {/* Empty state */}
        {!loading && filtered.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="text-center py-24"
          >
            <div className="w-16 h-16 rounded-2xl bg-[#111611] flex items-center justify-center mx-auto mb-4 border border-[#1c241c]">
              <BellOff size={28} className="text-slate-600" />
            </div>
            <h2 className="font-heading text-xl font-semibold text-white mb-1">
              {filter === "unread"
                ? "You're all caught up"
                : filter === "bookings"
                ? "No booking notifications"
                : filter === "inbounds"
                ? "No inbound or order notifications"
                : "No notifications yet"}
            </h2>
            <p className="text-sm text-slate-400 font-body max-w-xs mx-auto">
              {filter === "unread"
                ? "No unread notifications right now. New activity will appear here."
                : filter === "bookings"
                ? "Booking confirmations, payment updates, and warehouse activity will appear here."
                : filter === "inbounds"
                ? "Inbound shipments and dispatch updates will appear here."
                : "When you receive notifications about bookings, payments, and shipments, they will appear here."}
            </p>
          </motion.div>
        )}

        {/* Grouped list */}
        {groups.map((group) => (
          <div key={group.label} className="mb-7">
            <div className="flex items-center gap-2 mb-3">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-body">
                {group.label}
              </h2>
              <span className="text-[11px] text-slate-600 font-body">
                {group.items.length}
              </span>
              <div className="flex-1 h-px bg-[#1c241c]" />
            </div>
            <AnimatePresence mode="popLayout">
              <div className="space-y-2.5">
                {group.items.map((notification) => (
                  <NotificationCard
                    key={notification._id}
                    notification={notification}
                    onOpen={handleOpen}
                  />
                ))}
              </div>
            </AnimatePresence>
          </div>
        ))}

        {/* Load more */}
        {hasMore && (
          <div className="flex justify-center mt-2">
            <button
              onClick={() =>
                setVisibleCount((c) => Math.min(c + PAGE_SIZE, filtered.length))
              }
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full text-sm font-body font-medium text-slate-300 bg-[#111611] border border-[#1c241c] hover:border-[#84cc16]/40 hover:text-[#84cc16] transition-all duration-200"
            >
              Load more notifications
              <ChevronRight size={15} />
            </button>
          </div>
        )}

        {/* Bottom loading indicator */}
        {loading && notifications.length > 0 && (
          <div className="flex justify-center py-8">
            <Loader2 size={20} className="animate-spin text-[#84cc16]" />
          </div>
        )}

      </div>
    </div>
  );
}
