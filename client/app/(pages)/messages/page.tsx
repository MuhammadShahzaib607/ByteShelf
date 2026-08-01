"use client";

import { Suspense, useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, MessageCircle, ChevronLeft, ChevronRight, Send, CheckCheck, ChevronDown, Paperclip, X, FileText, Download, ZoomIn, ZoomOut, Maximize2, AlertCircle } from "lucide-react";
import { useAppSelector } from "@/redux/hooks";
import api from "@/lib/axios";
import { getSocket, disconnectSocket } from "@/lib/socket";
import { uploadMultipleToCloudinary } from "@/lib/cloudinary";

// ─── Types ──────────────────────────────────────────────────────────────────────

interface Participant {
  _id: string;
  name: string;
  role: string;
}

interface ParticipantWithStatus extends Participant {
  isOnline?: boolean;
  lastSeen?: string;
}

interface Conversation {
  _id: string;
  participants: string[];
  participantDetails: Participant[];
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
  warehouse?: string;
  createdAt: string;
}

interface Attachment {
  url: string;
  fileType: "image" | "pdf" | "document";
  fileName: string;
  fileSize: number | string;
}

interface MessageData {
  _id: string;
  conversation: string;
  sender: string;
  text: string;
  isRead: boolean;
  createdAt: string;
  attachments?: Attachment[];
}

interface SelectedFile {
  file: File;
  previewUrl: string;
}

interface PaginatedMessages {
  messages: MessageData[];
  currentPage: number;
  totalPages: number;
  totalMessages: number;
}

// ─── Helpers ────────────────────────────────────────────────────────────────────

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) {
    return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  }
  if (days === 1) return "Yesterday";
  if (days < 7) return d.toLocaleDateString("en-US", { weekday: "short" });
  return d.toLocaleDateString("en-US", { day: "numeric", month: "short" });
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatFileSize(size?: number | string) {
  if (size === undefined || size === null || size === "") return "File";
  const bytes = typeof size === "string" ? parseFloat(size) : size;
  if (isNaN(bytes) || bytes < 0) return "File";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getOtherParticipant(conv: Conversation, userId: string | null): Participant | null {
  if (!userId) return null;
  return conv.participantDetails?.find((p) => p._id !== userId) || null;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONVERSATION SIDEBAR ITEM
// ═══════════════════════════════════════════════════════════════════════════════

function ConversationItem({
  conv,
  isActive,
  userId,
  onClick,
}: {
  conv: Conversation;
  isActive: boolean;
  userId: string | null;
  onClick: () => void;
}) {
  const other = getOtherParticipant(conv, userId);
  const name = other?.name || "Unknown User";
  const initials = getInitials(name);

  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-4 py-3.5 rounded-xl transition-all duration-200 flex items-start gap-3 ${
        isActive
          ? "bg-[#D0F219]/10 border-l-4 border-l-[#D0F219] border border-lime-500/20"
          : "bg-transparent border border-transparent hover:bg-white/[0.03]"
      }`}
    >
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#D0F219] to-[#C0E70B] flex items-center justify-center shrink-0 mt-0.5">
        <span className="text-xs font-semibold text-[#12140E] font-body">{initials}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-semibold text-white font-body truncate">
            {name}
          </span>
          {conv.lastMessageAt && (
            <span className="text-[10px] text-slate-500 font-body shrink-0">
              {formatTime(conv.lastMessageAt)}
            </span>
          )}
        </div>
        <p className="text-xs text-slate-400 font-body truncate mt-0.5">
          {conv.lastMessage || "No messages yet"}
        </p>
      </div>
      {conv.unreadCount > 0 && (
        <span className="w-5 h-5 rounded-full bg-[#D0F219] text-[#12140E] text-[10px] font-bold flex items-center justify-center shrink-0 mt-1 font-body shadow-[0_0_12px_rgba(208,242,25,0.4)]">
          {conv.unreadCount > 9 ? "9+" : conv.unreadCount}
        </span>
      )}
    </button>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MESSAGE BUBBLE
// ═══════════════════════════════════════════════════════════════════════════════

function MessageBubble({
  message,
  isOwn,
  onOpenAttachment,
}: {
  message: MessageData;
  isOwn: boolean;
  onOpenAttachment: (attachments: Attachment[], index: number) => void;
}) {
  const attachments = message.attachments || [];
  const images = attachments.filter((a) => a.fileType === "image");
  const pdfs = attachments.filter((a) => a.fileType !== "image");
  const hasAttachments = attachments.length > 0;

  return (
    <div className={`flex ${isOwn ? "justify-end" : "justify-start"} mb-3`}>
      <div
        className={`max-w-[75%] sm:max-w-[65%] px-4 py-2.5 rounded-2xl ${
          isOwn
            ? "bg-[#D0F219] text-slate-950 rounded-br-lg shadow-[0_4px_20px_rgba(208,242,25,0.2)]"
            : "bg-slate-900 border border-slate-800 text-slate-100 rounded-bl-lg"
        }`}
      >
        {message.text && (
          <p
            className={`text-sm font-body leading-relaxed whitespace-pre-wrap break-words ${
              isOwn ? "font-semibold" : ""
            }`}
          >
            {message.text}
          </p>
        )}

        {/* Image attachments — clean grid inside the bubble */}
        {images.length > 0 && (
          <div
            className={`${message.text ? "mt-2" : ""} ${
              images.length === 1 ? "" : "grid grid-cols-2 gap-1.5"
            }`}
          >
            {images.map((att, i) => (
              <img
                key={`${att.url}-${i}`}
                src={att.url}
                alt={att.fileName || "Attachment"}
                loading="lazy"
                onClick={() => onOpenAttachment(attachments, attachments.indexOf(att))}
                className={`rounded-xl hover:opacity-80 transition-opacity duration-200 cursor-pointer object-cover bg-black/20 ${
                  images.length === 1 ? "w-full max-h-64" : "w-full h-32 sm:h-36"
                }`}
              />
            ))}
          </div>
        )}

        {/* PDF / document attachments — styled doc cards */}
        {pdfs.map((att, i) => (
          <div
            key={`${att.url}-${i}`}
            onClick={() => onOpenAttachment(attachments, attachments.indexOf(att))}
            className="bg-neutral-800/90 p-3 rounded-xl flex items-center gap-3 border border-neutral-700/60 w-full min-w-[220px] cursor-pointer hover:bg-neutral-800 transition-colors mt-2"
          >
            <div className="w-10 h-10 rounded-lg bg-red-500/15 flex items-center justify-center shrink-0">
              <FileText size={18} className="text-red-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white font-body truncate">
                {att.fileName || "Document"}
              </p>
              <p className="text-[11px] text-slate-400 font-body">
                {formatFileSize(att.fileSize)}
              </p>
            </div>
            <a
              href={att.url}
              download={att.fileName || "document.pdf"}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-300 hover:text-[#D0F219] hover:bg-white/5 transition-colors shrink-0"
            >
              <Download size={15} />
            </a>
          </div>
        ))}

        <div
          className={`flex items-center gap-1 ${hasAttachments ? "mt-2" : "mt-1"} ${
            isOwn ? "justify-end" : "justify-start"
          }`}
        >
          <span className={`text-[10px] ${isOwn ? "text-slate-900/80" : "text-slate-400"} font-body`}>
            {formatTime(message.createdAt)}
          </span>
          {isOwn && <CheckCheck size={12} className={message.isRead ? "text-slate-900" : "text-slate-900/50"} />}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// FULL-SCREEN ATTACHMENT VIEWER (WhatsApp-style lightbox / carousel)
// ═══════════════════════════════════════════════════════════════════════════════

function AttachmentViewer({
  attachments,
  initialIndex,
  onClose,
}: {
  attachments: Attachment[];
  initialIndex: number;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(initialIndex);
  const [scale, setScale] = useState(1);
  const count = attachments.length;
  const current = attachments[index] || attachments[0];
  const isPdf = current?.fileType !== "image";

  // Navigate to a specific attachment (also resets zoom)
  const goTo = useCallback(
    (i: number) => {
      setIndex(((i % count) + count) % count);
      setScale(1);
    },
    [count]
  );

  // Keyboard navigation: Escape closes, arrows cycle
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") goTo(index + 1);
      if (e.key === "ArrowLeft") goTo(index - 1);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [count, onClose, goTo, index]);

  if (!current) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex flex-col"
      onClick={onClose}
    >
      {/* Top bar: name, zoom, download, close */}
      <div
        className="flex items-center gap-3 px-5 py-4 shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white font-body truncate">
            {current.fileName || "Attachment"}
          </p>
          <p className="text-[11px] text-slate-400 font-body">
            {formatFileSize(current.fileSize)}
          </p>
        </div>

        {/* Zoom controls (images only) */}
        {!isPdf && (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setScale((s) => Math.min(4, +(s * 1.25).toFixed(2)))}
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 flex items-center justify-center text-white transition-colors"
              title="Zoom in"
            >
              <ZoomIn size={17} />
            </button>
            <button
              type="button"
              onClick={() => setScale((s) => Math.max(0.5, +(s / 1.25).toFixed(2)))}
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 flex items-center justify-center text-white transition-colors"
              title="Zoom out"
            >
              <ZoomOut size={17} />
            </button>
            <button
              type="button"
              onClick={() => setScale(1)}
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 flex items-center justify-center text-white transition-colors"
              title="Reset zoom / fit"
            >
              <Maximize2 size={16} />
            </button>
            <span className="text-[11px] text-slate-400 w-10 text-center font-body">
              {Math.round(scale * 100)}%
            </span>
          </div>
        )}

        <a
          href={current.url}
          download={current.fileName || "attachment"}
          target="_blank"
          rel="noopener noreferrer"
          className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 flex items-center justify-center text-white transition-colors"
          title="Download"
        >
          <Download size={18} />
        </a>
        <button
          type="button"
          onClick={onClose}
          className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 flex items-center justify-center text-white transition-colors"
          title="Close"
        >
          <X size={20} />
        </button>
      </div>

      {/* Main content */}
      <div
        className="flex-1 relative flex items-center justify-center px-4 pb-24 min-h-0"
        onClick={(e) => e.stopPropagation()}
      >
        {isPdf ? (
          <iframe
            src={current.url}
            title={current.fileName || "PDF"}
            className="w-full h-full max-w-4xl rounded-xl bg-white/5 border border-slate-800"
          />
        ) : (
          <img
            src={current.url}
            alt={current.fileName || "Image"}
            style={{ transform: `scale(${scale})` }}
            className="max-w-full max-h-full object-contain transition-transform duration-200 select-none"
          />
        )}

        {/* Prev / Next arrows */}
        {count > 1 && (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                goTo(index - 1);
              }}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 flex items-center justify-center text-white transition-all hover:scale-105"
              title="Previous"
            >
              <ChevronLeft size={22} />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                goTo(index + 1);
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 flex items-center justify-center text-white transition-all hover:scale-105"
              title="Next"
            >
              <ChevronRight size={22} />
            </button>
          </>
        )}
      </div>

      {/* Thumbnail filmstrip */}
      {count > 1 && (
        <div
          className="absolute bottom-4 left-1/2 -translate-x-1/2 max-w-[92vw] overflow-x-auto px-2 pb-1"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex gap-2">
            {attachments.map((att, i) => (
              <button
                type="button"
                key={`${att.url}-${i}`}
                onClick={() => goTo(i)}
                className={`shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-all ${
                  i === index
                    ? "border-[#D0F219] opacity-100"
                    : "border-transparent opacity-50 hover:opacity-80"
                }`}
              >
                {att.fileType === "image" ? (
                  <img src={att.url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-neutral-800 flex items-center justify-center">
                    <FileText size={18} className="text-red-400" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// WRAPPER — provides Suspense boundary for useSearchParams
// ═══════════════════════════════════════════════════════════════════════════════

export default function MessagesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0D0F0A] pt-24 pb-6 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto h-[calc(100vh-8rem)] flex items-center justify-center">
          <Loader2 size={28} className="animate-spin text-[#D0F219]" />
        </div>
      </div>
    }>
      <MessagesContent />
    </Suspense>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MESSAGES CONTENT (uses useSearchParams — wrapped in Suspense above)
// ═══════════════════════════════════════════════════════════════════════════════

function MessagesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { accessToken, user } = useAppSelector((state) => state.auth);
  const userId = user?.id || null;

  // ─── Conversations state ──────────────────────────────────────────────────
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [convLoading, setConvLoading] = useState(true);
  const [convError, setConvError] = useState(false);

  // ─── Active conversation state ────────────────────────────────────────────
  const initialConvId = searchParams.get("conversationId");
  const [activeConvId, setActiveConvId] = useState<string | null>(initialConvId);
  const [messages, setMessages] = useState<MessageData[]>([]);
  const [msgLoading, setMsgLoading] = useState(false);
  const [msgError, setMsgError] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);

  // ─── Send message state ───────────────────────────────────────────────────
  const [inputText, setInputText] = useState("");
  const [sending, setSending] = useState(false);

  // ─── Attachments state ────────────────────────────────────────────────────
  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ─── Attachment viewer state ──────────────────────────────────────────────
  const [viewer, setViewer] = useState<{ attachments: Attachment[]; index: number } | null>(null);

  // ─── Typing indicator state ───────────────────────────────────────────────
  const [otherTyping, setOtherTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // ─── Online status state ──────────────────────────────────────────────────
  const [onlineStatus, setOnlineStatus] = useState<Record<string, { isOnline: boolean; lastSeen?: string }>>({});

  // ─── Scroll-to-bottom state ─────────────────────────────────────────────
  const [showScrollBottomBtn, setShowScrollBottomBtn] = useState(false);

  // ─── Mobile sidebar toggle ────────────────────────────────────────────────
  const [showSidebar, setShowSidebar] = useState(!initialConvId);

  // ─── Refs ─────────────────────────────────────────────────────────────────
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const selectedFilesRef = useRef<SelectedFile[]>([]);

  useEffect(() => {
    selectedFilesRef.current = selectedFiles;
  }, [selectedFiles]);

  // Revoke attachment preview object URLs on unmount
  useEffect(() => {
    return () => {
      selectedFilesRef.current.forEach((sf) => {
        if (sf.previewUrl) URL.revokeObjectURL(sf.previewUrl);
      });
    };
  }, []);

  // ─── Active conversation (derived) ────────────────────────────────────────
  const activeConv = conversations.find((c) => c._id === activeConvId) || null;
  const otherParticipant = activeConv ? getOtherParticipant(activeConv, userId) : null;

  // ─── Auto-scroll to bottom when messages change ───────────────────────────
  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      if (chatContainerRef.current) {
        chatContainerRef.current.scrollTo({
          top: chatContainerRef.current.scrollHeight,
          behavior: "smooth",
        });
      }
    }, 50);
  }, []);

  // ─── Handle scroll events on the message container ───────────────────────
  const handleScroll = useCallback(() => {
    const container = chatContainerRef.current;
    if (!container) return;
    const { scrollTop, clientHeight, scrollHeight } = container;
    setShowScrollBottomBtn(scrollTop + clientHeight < scrollHeight - 150);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom, otherTyping]);

  // ─── Fetch conversations ──────────────────────────────────────────────────
  const fetchConversations = useCallback(async () => {
    if (!accessToken) return;
    try {
      setConvLoading(true);
      setConvError(false);
      const res = await api.get("/conversation/my-conversations");
      const data = res.data.data || [];
      setConversations(Array.isArray(data) ? data : []);
    } catch {
      setConvError(true);
    } finally {
      setConvLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // ─── Fetch messages for active conversation ───────────────────────────────
  const fetchMessages = useCallback(
    async (convId: string, pageNum: number = 1) => {
      if (!accessToken) return;
      try {
        setMsgLoading(true);
        setMsgError(false);
        const res = await api.get(
          `/conversation/${convId}/messages?page=${pageNum}&limit=20`
        );
        const data: PaginatedMessages = res.data.data;
        if (pageNum === 1) {
          setMessages(data.messages || []);
        } else {
          setMessages((prev) => [...(data.messages || []), ...prev]);
        }
        setHasMore(data.currentPage < data.totalPages);
        setPage(pageNum);
      } catch {
        setMsgError(true);
      } finally {
        setMsgLoading(false);
      }
    },
    [accessToken]
  );

  // ─── Mark messages as read ────────────────────────────────────────────────
  const markAsRead = useCallback(
    async (convId: string) => {
      try {
        await api.patch(`/conversation/${convId}/mark-read`);
        // Update unread count locally
        setConversations((prev) =>
          prev.map((c) =>
            c._id === convId ? { ...c, unreadCount: 0 } : c
          )
        );
      } catch {
        // silently handled
      }
    },
    []
  );    // ─── When active conversation changes ──────────────────────────────────────
  useEffect(() => {
    if (!activeConvId) return;
    // Reset typing indicator when switching conversations
    setOtherTyping(false);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    fetchMessages(activeConvId, 1);
    markAsRead(activeConvId);
    setShowSidebar(false);

    // Emit socket event for real-time read receipts when opening a conversation
    const socket = getSocket();
    if (socket?.connected) {
      socket.emit("message_read", { conversationId: activeConvId });
    }
  }, [activeConvId, fetchMessages, markAsRead]);

  // ─── Join all conversation rooms for real-time sidebar updates ───────────
  useEffect(() => {
    if (!accessToken || conversations.length === 0) return;

    const socket = getSocket();
    if (!socket?.connected) return;

    conversations.forEach((conv) => {
      socket.emit("join_conversation", conv._id);
    });
  }, [accessToken, conversations]);

  // ─── Socket setup for active conversation ─────────────────────────────────
  useEffect(() => {
    if (!activeConvId || !accessToken) return;

    const socket = getSocket();
    if (!socket) return;

    socket.emit("join_conversation", activeConvId);

    const handleReceiveMessage = (message: MessageData) => {
      // Update sidebar: update lastMessage, increment unreadCount for background, reorder
      setConversations((prev) => {
        const idx = prev.findIndex((c) => c._id === message.conversation);
        if (idx === -1) return prev;

        const isActive = message.conversation === activeConvId;

        const updated = prev.map((c) =>
          c._id === message.conversation
            ? {
                ...c,
                lastMessage: message.text || (message.attachments?.length ? "📎 Attachment" : ""),
                lastMessageAt: message.createdAt,
                // Increment unreadCount for background messages from other users
                unreadCount:
                  isActive || message.sender === userId
                    ? c.unreadCount
                    : (c.unreadCount || 0) + 1,
              }
            : c
        );

        // Move the updated conversation to the top of the sidebar
        if (idx > 0) {
          const [item] = updated.splice(idx, 1);
          updated.unshift(item);
        }
        return [...updated];
      });

      // If this message is for the active conversation, append it to messages
      if (message.conversation === activeConvId) {
        setMessages((prev) => {
          // Avoid duplicate keys
          if (prev.some((m) => m._id === message._id)) return prev;
          return [...prev, message];
        });

        // Auto-emit read receipt back to the sender (only if we are the receiver)
        if (message.sender !== userId) {
          socket.emit("message_read", { conversationId: activeConvId });
        }
      }
    };

    const handleMessagesRead = (data: { conversationId: string; readBy: string }) => {
      // If we're viewing this conversation, update sent messages to show as read
      if (data.conversationId === activeConvId) {
        setMessages((prev) =>
          prev.map((m) =>
            m.sender === userId && !m.isRead ? { ...m, isRead: true } : m
          )
        );
        // Also update unread count in sidebar
        setConversations((prev) =>
          prev.map((c) =>
            c._id === activeConvId ? { ...c, unreadCount: 0 } : c
          )
        );
      }
    };

    // ─── Typing indicator listener ────────────────────────────────────────
    const handleUserTyping = (data: { conversationId: string; userId: string; isTyping: boolean }) => {
      if (data.conversationId === activeConvId && data.userId !== userId) {
        setOtherTyping(data.isTyping);
      }
    };

    const handleError = (err: string) => {
      console.error("[Socket] Message error:", err);
    };

    socket.on("receive_message", handleReceiveMessage);
    socket.on("messages_read", handleMessagesRead);
    socket.on("user_typing", handleUserTyping);
    socket.on("error_message", handleError);

    return () => {
      socket.off("receive_message", handleReceiveMessage);
      socket.off("messages_read", handleMessagesRead);
      socket.off("user_typing", handleUserTyping);
      socket.off("error_message", handleError);
    };
  }, [activeConvId, accessToken, userId]);

  // ─── Global presence listeners (survives conversation switches) ───────────
  // Registered in a separate effect so they are NOT torn down when activeConvId
  // changes. This also eliminates the race condition where the server emits
  // `active_users_list` before the conversation-specific effect registers.
  useEffect(() => {
    if (!accessToken) return;

    const socket = getSocket();
    if (!socket) return;

    const handleActiveUsersList = (activeUserIds: string[]) => {
      setOnlineStatus((prev) => {
        const updated = { ...prev };
        activeUserIds.forEach((id) => {
          updated[id] = { ...updated[id], isOnline: true };
        });
        return updated;
      });
    };

    const handleUserStatus = (data: { userId: string; isOnline: boolean; lastSeen?: string }) => {
      setOnlineStatus((prev) => ({
        ...prev,
        [data.userId]: { isOnline: data.isOnline, lastSeen: data.lastSeen },
      }));
    };

    socket.on("active_users_list", handleActiveUsersList);
    socket.on("user_status", handleUserStatus);

    return () => {
      socket.off("active_users_list", handleActiveUsersList);
      socket.off("user_status", handleUserStatus);
    };
  }, [accessToken, userId]);

  // ─── Cleanup socket on unmount ────────────────────────────────────────────
  useEffect(() => {
    return () => {
      disconnectSocket();
    };
  }, []);

  // ─── Handle typing indicator ──────────────────────────────────────────────
  const emitTypingStart = useCallback(() => {
    if (!activeConvId) return;
    const socket = getSocket();
    if (socket?.connected) {
      socket.emit("typing_start", { conversationId: activeConvId });
    }
  }, [activeConvId]);

  const emitTypingStop = useCallback(() => {
    if (!activeConvId) return;
    const socket = getSocket();
    if (socket?.connected) {
      socket.emit("typing_stop", { conversationId: activeConvId });
    }
  }, [activeConvId]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    // Emit typing start on first character
    if (!typingTimeoutRef.current) {
      emitTypingStart();
    }
    // Reset the stop timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(() => {
      emitTypingStop();
      typingTimeoutRef.current = null;
    }, 2500);
  }, [emitTypingStart, emitTypingStop]);

  // ─── Handle file selection (max 5, images + PDFs) ────────────────────────
  const handleFilesSelected = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      e.target.value = ""; // allow re-selecting the same file

      const MAX_FILES = 5;
      const ACCEPTED = ["image/png", "image/jpeg", "image/webp", "application/pdf"];

      if (files.length === 0) return;

      const remaining = MAX_FILES - selectedFiles.length;
      if (files.length > remaining) {
        setUploadError(
          `You can attach up to ${MAX_FILES} files (${remaining} slot${remaining === 1 ? "" : "s"} remaining).`
        );
        return;
      }

      const invalid = files.find((f) => !ACCEPTED.includes(f.type));
      if (invalid) {
        setUploadError("Only PNG, JPG, WEBP images and PDF files are allowed.");
        return;
      }

      setUploadError(null);
      setSelectedFiles((prev) => [
        ...prev,
        ...files.map((f) => ({
          file: f,
          previewUrl: f.type.startsWith("image/") ? URL.createObjectURL(f) : "",
        })),
      ]);
    },
    [selectedFiles.length]
  );

  const removeFile = useCallback((index: number) => {
    setSelectedFiles((prev) => {
      const target = prev[index];
      if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((_, i) => i !== index);
    });
    setUploadError(null);
  }, []);

  // ─── Send message ─────────────────────────────────────────────────────────
  const handleSend = useCallback(async () => {
    const text = inputText.trim();
    const hasAttachments = selectedFiles.length > 0;
    if ((!text && !hasAttachments) || !activeConvId || sending || uploading) return;

    // Stop typing indicator
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    emitTypingStop();

    setSending(true);
    try {
      // Upload attachments to Cloudinary before sending (max 5 files)
      let attachments: Attachment[] = [];
      if (hasAttachments) {
        setUploading(true);
        const results = await uploadMultipleToCloudinary(
          selectedFiles.map((sf) => sf.file),
          5
        );
        attachments = results.map((r, i) => ({
          url: r.secure_url,
          fileType: selectedFiles[i].file.type === "application/pdf" ? "pdf" : "image",
          fileName: selectedFiles[i].file.name,
          fileSize: selectedFiles[i].file.size,
        }));
      }

      const socket = getSocket();
      if (socket?.connected) {
        socket.emit("send_message", { conversationId: activeConvId, text, attachments });
      }
      setInputText("");
      selectedFiles.forEach((sf) => {
        if (sf.previewUrl) URL.revokeObjectURL(sf.previewUrl);
      });
      setSelectedFiles([]);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Failed to upload attachment(s).");
    } finally {
      setUploading(false);
      setSending(false);
    }
  }, [inputText, activeConvId, sending, uploading, selectedFiles, emitTypingStop]);

  // ─── Load more (pagination) ───────────────────────────────────────────────
  const loadMore = useCallback(() => {
    if (activeConvId && hasMore && !msgLoading) {
      fetchMessages(activeConvId, page + 1);
    }
  }, [activeConvId, hasMore, msgLoading, fetchMessages, page]);

  // ─── Handle conversation select ───────────────────────────────────────────
  const selectConversation = useCallback((convId: string) => {
    setActiveConvId(convId);
    router.replace(`/messages?conversationId=${convId}`, { scroll: false });
    setMessages([]);
    setPage(1);
  }, [router]);

  // ─── Handle Enter key ─────────────────────────────────────────────────────
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#0D0F0A] pt-24 pb-6 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto h-[calc(100vh-8rem)]">
        {/* Mobile back to sidebar button */}
        {!showSidebar && activeConvId && (
          <button
            onClick={() => setShowSidebar(true)}
            className="sm:hidden flex items-center gap-1.5 text-sm text-slate-400 hover:text-[#D0F219] font-body mb-3"
          >
            <ChevronLeft size={16} />
            All Conversations
          </button>
        )}

        {/* Main Chat Container */}
        <div className="h-full bg-[#11140C]/90 rounded-3xl shadow-2xl shadow-black/40 border border-lime-500/15 overflow-hidden flex flex-col sm:flex-row">
          {/* ═══ SIDEBAR ═══ */}
          <div
            className={`${
              showSidebar || !activeConvId ? "flex" : "hidden"
            } sm:flex flex-col w-full sm:w-80 lg:w-96 border-r border-lime-500/10 bg-[#11140C]/40`}
          >
            {/* Sidebar Header */}
            <div className="p-4 border-b border-lime-500/10">
              <h2 className="font-heading text-lg font-semibold text-white">
                Messages
              </h2>
              <p className="text-xs text-slate-400 font-body mt-0.5">
                Your conversations
              </p>
            </div>

            {/* Conversations List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-1">
              {convLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 size={20} className="animate-spin text-[#D0F219]" />
                </div>
              ) : convError ? (
                <div className="text-center py-12">
                  <MessageCircle size={28} className="mx-auto text-lime-400/30 mb-2" />
                  <p className="text-xs text-slate-400 font-body">
                    Failed to load conversations.
                  </p>
                </div>
              ) : conversations.length === 0 ? (
                <div className="text-center py-12">
                  <MessageCircle size={28} className="mx-auto text-lime-400/30 mb-2" />
                  <p className="text-xs text-slate-400 font-body">
                    No conversations yet.
                  </p>
                  <p className="text-[10px] text-slate-500 font-body mt-1">
                    Chat with a warehouse owner from a booking to get started.
                  </p>
                </div>
              ) : (
                conversations.map((conv) => (
                  <ConversationItem
                    key={conv._id}
                    conv={conv}
                    isActive={conv._id === activeConvId}
                    userId={userId}
                    onClick={() => selectConversation(conv._id)}
                  />
                ))
              )}
            </div>
          </div>

          {/* ═══ MAIN CHAT WINDOW ═══ */}
          <div
            className={`${
              !showSidebar && activeConvId ? "flex" : "hidden"
            } sm:flex flex-col flex-1 bg-[#11140C]/40 relative`}
          >
            {!activeConvId ? (
              /* Empty State */
              <div className="flex-1 flex items-center justify-center p-8">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-lime-500/15 flex items-center justify-center mx-auto mb-4">
                    <MessageCircle size={32} className="text-lime-400/40" />
                  </div>
                  <h3 className="font-heading text-lg font-semibold text-white mb-2">
                    Select a conversation
                  </h3>
                  <p className="text-sm text-slate-400 font-body max-w-sm">
                    Choose a conversation from the sidebar to start chatting, or
                    chat with a warehouse owner from one of your bookings.
                  </p>
                </div>
              </div>
            ) : (
              <>
                {/* Chat Header */}
                <div className="px-5 py-4 border-b border-lime-500/10 flex items-center gap-3 shrink-0">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#D0F219] to-[#C0E70B] flex items-center justify-center shrink-0 relative">
                    <span className="text-xs font-semibold text-[#12140E] font-body">
                      {otherParticipant
                        ? getInitials(otherParticipant.name)
                        : "?"}
                    </span>
                    {/* Online indicator dot */}
                    {otherParticipant && onlineStatus[otherParticipant._id]?.isOnline && (
                      <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-[#D0F219] border-2 border-[#11140C]" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-white font-body truncate">
                        {otherParticipant?.name || "Unknown User"}
                      </p>
                      {/* Online / Last Seen status */}
                      {otherParticipant && onlineStatus[otherParticipant._id]?.isOnline ? (
                        <span className="text-[10px] text-[#D0F219] font-body font-medium shrink-0">Online</span>
                      ) : otherParticipant && onlineStatus[otherParticipant._id]?.lastSeen ? (
                        <span className="text-[10px] text-slate-500 font-body shrink-0">
                          Last seen {formatTime(onlineStatus[otherParticipant._id].lastSeen!)}
                        </span>
                      ) : null}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <p className="text-[11px] text-slate-400 font-body capitalize">
                        {otherParticipant?.role === "warehouseOwner"
                          ? "Warehouse Owner"
                          : otherParticipant?.role === "merchant"
                          ? "Merchant"
                          : otherParticipant?.role || ""}
                      </p>
                      {/* (typing indicator moved into message flow) */}
                    </div>
                  </div>
                </div>

                {/* Messages Area */}
                <div
                  ref={chatContainerRef}
                  onScroll={handleScroll}
                  className="flex-1 overflow-y-auto px-5 py-4 bg-[#0D0F0A]/60"
                >
                  {/* Load More */}
                  {hasMore && (
                    <div className="text-center mb-4">
                      <button
                        onClick={loadMore}
                        disabled={msgLoading}
                        className="text-xs text-[#D0F219] font-medium hover:underline font-body disabled:opacity-50"
                      >
                        {msgLoading ? "Loading..." : "Load earlier messages"}
                      </button>
                    </div>
                  )}

                  {/* Message Loading */}
                  {msgLoading && page === 1 && (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 size={20} className="animate-spin text-[#D0F219]" />
                    </div>
                  )}

                  {/* Message Error */}
                  {msgError && (
                    <div className="text-center py-8">
                      <p className="text-xs text-red-400 font-body">
                        Failed to load messages.
                      </p>
                    </div>
                  )}

                  {/* No Messages */}
                  {!msgLoading && !msgError && messages.length === 0 && (
                    <div className="text-center py-12">
                      <MessageCircle size={28} className="mx-auto text-lime-400/30 mb-2" />
                      <p className="text-sm text-slate-400 font-body">
                        No messages yet.
                      </p>
                      <p className="text-xs text-slate-500 font-body mt-1">
                        Send a message to start the conversation.
                      </p>
                    </div>
                  )}

                  {/* Messages List */}
                  {messages.length > 0 && (
                    <div className="space-y-1">
                      {/* Date separator for first message */}
                      <div className="text-center mb-4">
                        <span className="text-[10px] text-[#0F172A]/30 font-body bg-white px-3 py-1 rounded-full">
                          {formatDate(messages[0].createdAt)}
                        </span>
                      </div>

                      {[...messages]
                        .sort(
                          (a, b) =>
                            new Date(a.createdAt).getTime() -
                            new Date(b.createdAt).getTime()
                        )
                        .map((msg, i) => {
                          const isOwn = msg.sender === userId;
                          // Date separator between days
                          const showDateSep =
                            i > 0 &&
                            new Date(msg.createdAt).toDateString() !==
                              new Date(messages[i - 1]?.createdAt).toDateString();

                          return (
                            <div key={msg._id}>
                              {showDateSep && (
                                <div className="text-center my-4">
                                  <span className="text-[10px] text-slate-300 font-body bg-slate-900/80 border border-slate-800 px-3 py-1 rounded-full">
                                    {formatDate(msg.createdAt)}
                                  </span>
                                </div>
                              )}
                              <MessageBubble
                                message={msg}
                                isOwn={isOwn}
                                onOpenAttachment={(attachments, index) =>
                                  setViewer({ attachments, index })
                                }
                              />
                            </div>
                          );
                        })}
                    </div>
                  )}

                  {/* ─── Animated Typing Bubble (in message flow) ──────────── */}
                  {otherTyping && (
                    <div className="flex justify-start mb-3">
                      <div className="px-5 py-4 rounded-2xl bg-slate-900 border border-slate-800 text-slate-100 rounded-bl-lg inline-flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-lime-400/70 animate-bounce" style={{ animationDelay: "0ms" }} />
                        <span className="w-2 h-2 rounded-full bg-lime-400/70 animate-bounce" style={{ animationDelay: "150ms" }} />
                        <span className="w-2 h-2 rounded-full bg-lime-400/70 animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                    </div>
                  )}

                  {/* Scroll anchor */}
                  <div ref={messagesEndRef} />
                </div>

                {/* Scroll to bottom floating button */}
                {showScrollBottomBtn && (
                  <button
                    onClick={scrollToBottom}
                    className="absolute bottom-20 right-6 w-10 h-10 rounded-full bg-[#12150E] border border-slate-700 shadow-lg flex items-center justify-center text-slate-400 hover:text-[#D0F219] hover:border-lime-500/40 hover:shadow-[0_0_20px_rgba(208,242,25,0.2)] transition-all duration-200 z-10"
                  >
                    <ChevronDown size={18} />
                  </button>
                )}

                {/* Message Input */}
                <div className="px-5 py-4 border-t border-lime-500/10 shrink-0">
                  {/* Attachment preview bar (pre-send) */}
                  {selectedFiles.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {selectedFiles.map((sel, i) => (
                        <div key={`${sel.file.name}-${i}`} className="group relative">
                          {sel.previewUrl ? (
                            <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-slate-700 shadow-lg shadow-black/30">
                              <img
                                src={sel.previewUrl}
                                alt={sel.file.name}
                                className="w-full h-full object-cover"
                              />
                              <button
                                type="button"
                                onClick={() => removeFile(i)}
                                className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/70 border border-white/10 flex items-center justify-center opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity hover:bg-red-500/80"
                              >
                                <X size={11} className="text-white" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 bg-neutral-800/80 border border-slate-700 rounded-xl pl-3 pr-2 py-2 max-w-[220px]">
                              <FileText size={15} className="text-red-400 shrink-0" />
                              <span className="text-xs text-white font-body truncate">
                                {sel.file.name}
                              </span>
                              <button
                                type="button"
                                onClick={() => removeFile(i)}
                                className="text-slate-400 hover:text-red-400 transition-colors shrink-0"
                              >
                                <X size={13} />
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Upload / validation error */}
                  {uploadError && (
                    <p className="text-[11px] text-red-400 font-body mb-2 flex items-center gap-1.5">
                      <AlertCircle size={12} className="shrink-0" />
                      {uploadError}
                    </p>
                  )}

                  <div className="flex items-end gap-3">
                    {/* Attachment picker */}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={sending || uploading}
                      title="Attach files (PNG, JPG, WEBP, PDF — max 5)"
                      className="w-11 h-11 rounded-full border border-slate-700 text-slate-400 hover:text-[#D0F219] hover:border-lime-500/40 flex items-center justify-center transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                    >
                      {uploading ? (
                        <Loader2 size={18} className="animate-spin text-[#D0F219]" />
                      ) : (
                        <Paperclip size={18} />
                      )}
                    </button>

                    <div className="flex-1 relative">
                      <textarea
                        value={inputText}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                        placeholder="Type your message..."
                        rows={1}
                        className="w-full px-4 py-3 bg-[#0A0C07] border border-slate-800 rounded-2xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-[#D0F219] focus:ring-1 focus:ring-[#D0F219]/50 transition-all font-body resize-none"
                        style={{ minHeight: 44, maxHeight: 120 }}
                      />
                    </div>
                    <button
                      onClick={handleSend}
                      disabled={
                        (!inputText.trim() && selectedFiles.length === 0) || sending || uploading
                      }
                      className="w-11 h-11 rounded-full bg-[#D0F219] text-[#12140E] flex items-center justify-center hover:bg-lime-300 hover:shadow-[0_0_20px_rgba(208,242,25,0.3)] transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 shadow-sm shrink-0"
                    >
                      {sending ? (
                        <Loader2 size={18} className="animate-spin" />
                      ) : (
                        <Send size={18} />
                      )}
                    </button>
                  </div>

                  {/* Hidden file input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/png,image/jpeg,image/webp,application/pdf,.png,.jpg,.jpeg,.webp,.pdf"
                    onChange={handleFilesSelected}
                    className="hidden"
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Full-screen attachment viewer */}
      {viewer && (
        <AttachmentViewer
          attachments={viewer.attachments}
          initialIndex={viewer.index}
          onClose={() => setViewer(null)}
        />
      )}
    </div>
  );
}