"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bell,
  BellOff,
  ChevronRight,
  CalendarDays,
  Info,
  Scan,
  ShieldCheck,
} from "lucide-react";
import type { ElementType } from "react";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  fetchNotifications,
  markNotificationAsRead,
  readAllNotifications,
} from "@/redux/slices/notificationSlice";
import type { Notification } from "@/redux/slices/notificationSlice";

// ─── Notification helpers ───────────────────────────────────────────────────────

type NotificationCategory = "booking" | "inbound" | "payment" | "system";

// Bucket a notification into a category by scanning its title + message.
function notificationCategory(
  n: Pick<Notification, "title" | "message">
): NotificationCategory {
  const text = `${n.title || ""} ${n.message}`.toLowerCase();
  if (/(booking|confirmed|declined|rejected|cancelled|cancel)/.test(text))
    return "booking";
  if (/(payment|paid|proof|invoice)/.test(text)) return "payment";
  if (/(inbound|dispatch|shipment|order|pickup|deliver|carton)/.test(text))
    return "inbound";
  return "system";
}

const notificationCategoryIcon: Record<
  NotificationCategory,
  { icon: ElementType; iconClass: string; boxClass: string }
> = {
  booking: {
    icon: CalendarDays,
    iconClass: "text-[#84cc16]",
    boxClass: "bg-[#84cc16]/10 border border-[#84cc16]/25",
  },
  inbound: {
    icon: Scan,
    iconClass: "text-sky-400",
    boxClass: "bg-sky-400/10 border border-sky-500/25",
  },
  payment: {
    icon: ShieldCheck,
    iconClass: "text-emerald-400",
    boxClass: "bg-emerald-400/10 border border-emerald-500/25",
  },
  system: {
    icon: Info,
    iconClass: "text-slate-300",
    boxClass: "bg-white/[0.06] border border-[#1f291f]",
  },
};

function notificationTimeAgo(dateStr: string): string {
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
  return new Date(dateStr).toLocaleDateString();
}

// ─── Notification Bell + Dropdown ───────────────────────────────────────────────

export default function NotificationBell({ unreadCount }: { unreadCount: number }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { notifications } = useAppSelector((state) => state.notifications);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);

  // Fresh fetch (limit 4, unread first) each time the dropdown opens
  useEffect(() => {
    if (open) dispatch(fetchNotifications({ limit: 4 }));
  }, [open, dispatch]);

  // Prioritize unread, then newest — capped at 4 for the dropdown
  const items = [...notifications]
    .sort((a, b) => {
      if (a.isRead !== b.isRead) return a.isRead ? 1 : -1;
      return (
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    })
    .slice(0, 4);

  // Clicking an item only closes the dropdown and marks it as read — no navigation.
  const handleItemClick = (n: Notification) => {
    setOpen(false);
    if (!n.isRead) dispatch(markNotificationAsRead(n._id));
  };

  const handleMarkAllRead = async () => {
    await dispatch(readAllNotifications());
  };

  // Close before navigating to the notifications page
  const closeAndGo = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Notifications"
        aria-expanded={open}
        className="relative flex items-center justify-center w-9 h-9 rounded-full bg-white/[0.05] border border-[#84cc16]/20 hover:bg-[#84cc16]/10 hover:border-[#84cc16]/50 transition-all"
      >
        <Bell size={17} className="text-slate-200" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 border-2 border-[#0D0F0A] text-[9px] font-bold text-white font-body shadow-sm">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-80 md:w-96 rounded-2xl bg-[#0e130e] border border-[#1f291f] shadow-2xl shadow-black/60 overflow-hidden z-50"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#1f291f] bg-[#111611]">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-white font-heading">
                  Notifications
                </span>
                {unreadCount > 0 && (
                  <span className="text-[10px] font-bold text-[#84cc16] bg-[#84cc16]/10 border border-[#84cc16]/25 px-1.5 py-px rounded-full font-body">
                    {unreadCount} Unread
                  </span>
                )}
              </div>
              <button
                onClick={handleMarkAllRead}
                disabled={unreadCount === 0}
                className={`text-xs font-body font-medium transition-colors ${
                  unreadCount === 0
                    ? "text-slate-600 cursor-not-allowed"
                    : "text-[#84cc16] hover:text-[#a3e635]"
                }`}
              >
                Mark all as read
              </button>
            </div>

            {/* Content */}
            <div className="max-h-96 overflow-y-auto">
              {items.length === 0 ? (
                <div className="px-4 py-10 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-[#1f291f] flex items-center justify-center mx-auto mb-3">
                    <BellOff size={22} className="text-slate-600" />
                  </div>
                  <p className="text-sm font-medium text-slate-200 font-body">
                    No new notifications
                  </p>
                  <p className="text-xs text-slate-500 font-body mt-1">
                    Booking, payment, and shipment updates will appear here.
                  </p>
                </div>
              ) : (
                <div className="py-1.5">
                  {items.map((n) => {
                    const cat = notificationCategory(n);
                    const cfg = notificationCategoryIcon[cat];
                    const Icon = cfg.icon;
                    return (
                      <button
                        key={n._id}
                        onClick={() => handleItemClick(n)}
                        className={`w-full text-left flex items-start gap-3 px-4 py-3 transition-colors ${
                          !n.isRead
                            ? "bg-[#84cc16]/[0.06] hover:bg-[#84cc16]/10"
                            : "hover:bg-white/[0.03]"
                        }`}
                      >
                        <span
                          className={`shrink-0 w-8 h-8 rounded-xl flex items-center justify-center ${cfg.boxClass}`}
                        >
                          <Icon size={14} className={cfg.iconClass} />
                        </span>
                        <span className="flex-1 min-w-0">
                          <span className="flex items-center gap-2">
                            <span
                              className={`text-[13px] font-semibold font-body truncate ${
                                n.isRead ? "text-slate-300" : "text-white"
                              }`}
                            >
                              {n.title || cat}
                            </span>
                            {!n.isRead && (
                              <span className="shrink-0 w-2 h-2 rounded-full bg-[#84cc16] shadow-[0_0_8px_rgba(132,204,22,0.9)]" />
                            )}
                          </span>
                          <span className="block text-xs text-slate-400 font-body truncate mt-0.5">
                            {n.message}
                          </span>
                          <span className="block text-[10px] text-slate-500 font-body mt-1">
                            {notificationTimeAgo(n.createdAt)}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <button
              onClick={() => closeAndGo("/notifications")}
              className="w-full flex items-center justify-center gap-1.5 px-4 py-3 text-sm font-medium text-[#84cc16] hover:text-[#a3e635] hover:bg-[#84cc16]/5 border-t border-[#1f291f] font-body transition-colors"
            >
              View all notifications
              <ChevronRight size={15} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
