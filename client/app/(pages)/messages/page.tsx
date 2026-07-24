"use client";

import { Suspense, useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, MessageCircle, ChevronLeft, Send, CheckCheck, ChevronDown } from "lucide-react";
import { useAppSelector } from "@/redux/hooks";
import api from "@/lib/axios";
import { getSocket, disconnectSocket } from "@/lib/socket";

// ─── Types ──────────────────────────────────────────────────────────────────────

interface Participant {
  _id: string;
  name: string;
  role: string;
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

interface MessageData {
  _id: string;
  conversation: string;
  sender: string;
  text: string;
  isRead: boolean;
  createdAt: string;
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
          ? "bg-[#0284C7]/10 border border-[#0284C7]/20"
          : "bg-white border border-transparent hover:bg-[#F8FAFC]/60"
      }`}
    >
      <div className="w-10 h-10 rounded-full bg-[#1E293B] flex items-center justify-center shrink-0 mt-0.5">
        <span className="text-xs font-semibold text-white font-body">{initials}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-semibold text-[#1E293B] font-body truncate">
            {name}
          </span>
          {conv.lastMessageAt && (
            <span className="text-[10px] text-[#0F172A]/40 font-body shrink-0">
              {formatTime(conv.lastMessageAt)}
            </span>
          )}
        </div>
        <p className="text-xs text-[#0F172A]/50 font-body truncate mt-0.5">
          {conv.lastMessage || "No messages yet"}
        </p>
      </div>
      {conv.unreadCount > 0 && (
        <span className="w-5 h-5 rounded-full bg-[#0284C7] text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-1 font-body">
          {conv.unreadCount > 9 ? "9+" : conv.unreadCount}
        </span>
      )}
    </button>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MESSAGE BUBBLE
// ═══════════════════════════════════════════════════════════════════════════════

function MessageBubble({ message, isOwn }: { message: MessageData; isOwn: boolean }) {
  return (
    <div className={`flex ${isOwn ? "justify-end" : "justify-start"} mb-3`}>
      <div
        className={`max-w-[75%] sm:max-w-[65%] px-4 py-2.5 rounded-2xl ${
          isOwn
            ? "bg-[#0284C7] text-white rounded-br-lg"
            : "bg-[#F8FAFC] border border-[#E2E8F0] text-[#1E293B] rounded-bl-lg"
        }`}
      >
        <p className="text-sm font-body leading-relaxed whitespace-pre-wrap break-words">
          {message.text}
        </p>
        <div className={`flex items-center gap-1 mt-1 ${isOwn ? "justify-end" : "justify-start"}`}>
          <span className={`text-[10px] ${isOwn ? "text-white/60" : "text-[#0F172A]/40"} font-body`}>
            {formatTime(message.createdAt)}
          </span>
          {isOwn && <CheckCheck size={12} className={message.isRead ? "text-white" : "text-white/40"} />}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// WRAPPER — provides Suspense boundary for useSearchParams
// ═══════════════════════════════════════════════════════════════════════════════

export default function MessagesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#F8FAFC] pt-24 pb-6 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto h-[calc(100vh-8rem)] flex items-center justify-center">
          <Loader2 size={28} className="animate-spin text-[#0284C7]" />
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

  // ─── Scroll-to-bottom state ─────────────────────────────────────────────
  const [showScrollBottomBtn, setShowScrollBottomBtn] = useState(false);

  // ─── Mobile sidebar toggle ────────────────────────────────────────────────
  const [showSidebar, setShowSidebar] = useState(!initialConvId);

  // ─── Refs ─────────────────────────────────────────────────────────────────
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

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
  }, [messages, scrollToBottom]);

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
  );

  // ─── When active conversation changes ──────────────────────────────────────
  useEffect(() => {
    if (!activeConvId) return;
    fetchMessages(activeConvId, 1);
    markAsRead(activeConvId);
    setShowSidebar(false);
  }, [activeConvId, fetchMessages, markAsRead]);

  // ─── Socket setup for active conversation ─────────────────────────────────
  useEffect(() => {
    if (!activeConvId || !accessToken) return;

    const socket = getSocket();
    if (!socket) return;

    socket.emit("join_conversation", activeConvId);

    const handleReceiveMessage = (message: MessageData) => {
      // Update sidebar: update lastMessage + move conversation to top
      setConversations((prev) => {
        const idx = prev.findIndex((c) => c._id === message.conversation);
        if (idx === -1) return prev;

        const updated = prev.map((c) =>
          c._id === message.conversation
            ? { ...c, lastMessage: message.text, lastMessageAt: message.createdAt }
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

    const handleError = (err: string) => {
      console.error("[Socket] Message error:", err);
    };

    socket.on("receive_message", handleReceiveMessage);
    socket.on("messages_read", handleMessagesRead);
    socket.on("error_message", handleError);

    return () => {
      socket.off("receive_message", handleReceiveMessage);
      socket.off("messages_read", handleMessagesRead);
      socket.off("error_message", handleError);
    };
  }, [activeConvId, accessToken, userId]);

  // ─── Cleanup socket on unmount ────────────────────────────────────────────
  useEffect(() => {
    return () => {
      disconnectSocket();
    };
  }, []);

  // ─── Send message ─────────────────────────────────────────────────────────
  const handleSend = useCallback(async () => {
    const text = inputText.trim();
    if (!text || !activeConvId || sending) return;

    setSending(true);
    const socket = getSocket();
    if (socket?.connected) {
      socket.emit("send_message", { conversationId: activeConvId, text });
    }
    setInputText("");
    setSending(false);
  }, [inputText, activeConvId, sending]);

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
    <div className="min-h-screen bg-[#F8FAFC] pt-24 pb-6 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto h-[calc(100vh-8rem)]">
        {/* Mobile back to sidebar button */}
        {!showSidebar && activeConvId && (
          <button
            onClick={() => setShowSidebar(true)}
            className="sm:hidden flex items-center gap-1.5 text-sm text-[#0F172A]/50 hover:text-[#1E293B] font-body mb-3"
          >
            <ChevronLeft size={16} />
            All Conversations
          </button>
        )}

        {/* Main Chat Container */}
        <div className="h-full bg-white rounded-3xl shadow-sm border border-[#E2E8F0] overflow-hidden flex flex-col sm:flex-row">
          {/* ═══ SIDEBAR ═══ */}
          <div
            className={`${
              showSidebar || !activeConvId ? "flex" : "hidden"
            } sm:flex flex-col w-full sm:w-80 lg:w-96 border-r border-[#E2E8F0] bg-white`}
          >
            {/* Sidebar Header */}
            <div className="p-4 border-b border-[#E2E8F0]">
              <h2 className="font-heading text-lg font-semibold text-[#1E293B]">
                Messages
              </h2>
              <p className="text-xs text-[#0F172A]/50 font-body mt-0.5">
                Your conversations
              </p>
            </div>

            {/* Conversations List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-1">
              {convLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 size={20} className="animate-spin text-[#0284C7]" />
                </div>
              ) : convError ? (
                <div className="text-center py-12">
                  <MessageCircle size={28} className="mx-auto text-[#0284C7]/30 mb-2" />
                  <p className="text-xs text-[#0F172A]/50 font-body">
                    Failed to load conversations.
                  </p>
                </div>
              ) : conversations.length === 0 ? (
                <div className="text-center py-12">
                  <MessageCircle size={28} className="mx-auto text-[#0284C7]/30 mb-2" />
                  <p className="text-xs text-[#0F172A]/50 font-body">
                    No conversations yet.
                  </p>
                  <p className="text-[10px] text-[#0F172A]/30 font-body mt-1">
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
            } sm:flex flex-col flex-1 bg-white relative`}
          >
            {!activeConvId ? (
              /* Empty State */
              <div className="flex-1 flex items-center justify-center p-8">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-2xl bg-[#F8FAFC] flex items-center justify-center mx-auto mb-4">
                    <MessageCircle size={32} className="text-[#0284C7]/40" />
                  </div>
                  <h3 className="font-heading text-lg font-semibold text-[#1E293B] mb-2">
                    Select a conversation
                  </h3>
                  <p className="text-sm text-[#0F172A]/50 font-body max-w-sm">
                    Choose a conversation from the sidebar to start chatting, or
                    chat with a warehouse owner from one of your bookings.
                  </p>
                </div>
              </div>
            ) : (
              <>
                {/* Chat Header */}
                <div className="px-5 py-4 border-b border-[#E2E8F0] flex items-center gap-3 shrink-0">
                  <div className="w-9 h-9 rounded-full bg-[#1E293B] flex items-center justify-center shrink-0">
                    <span className="text-xs font-semibold text-white font-body">
                      {otherParticipant
                        ? getInitials(otherParticipant.name)
                        : "?"}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#1E293B] font-body truncate">
                      {otherParticipant?.name || "Unknown User"}
                    </p>
                    <p className="text-[11px] text-[#0F172A]/40 font-body capitalize">
                      {otherParticipant?.role === "warehouseOwner"
                        ? "Warehouse Owner"
                        : otherParticipant?.role === "merchant"
                        ? "Merchant"
                        : otherParticipant?.role || ""}
                    </p>
                  </div>
                </div>

                {/* Messages Area */}
                <div
                  ref={chatContainerRef}
                  onScroll={handleScroll}
                  className="flex-1 overflow-y-auto px-5 py-4 bg-white"
                >
                  {/* Load More */}
                  {hasMore && (
                    <div className="text-center mb-4">
                      <button
                        onClick={loadMore}
                        disabled={msgLoading}
                        className="text-xs text-[#0284C7] font-medium hover:underline font-body disabled:opacity-50"
                      >
                        {msgLoading ? "Loading..." : "Load earlier messages"}
                      </button>
                    </div>
                  )}

                  {/* Message Loading */}
                  {msgLoading && page === 1 && (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 size={20} className="animate-spin text-[#0284C7]" />
                    </div>
                  )}

                  {/* Message Error */}
                  {msgError && (
                    <div className="text-center py-8">
                      <p className="text-xs text-red-500 font-body">
                        Failed to load messages.
                      </p>
                    </div>
                  )}

                  {/* No Messages */}
                  {!msgLoading && !msgError && messages.length === 0 && (
                    <div className="text-center py-12">
                      <MessageCircle size={28} className="mx-auto text-[#0284C7]/30 mb-2" />
                      <p className="text-sm text-[#0F172A]/50 font-body">
                        No messages yet.
                      </p>
                      <p className="text-xs text-[#0F172A]/30 font-body mt-1">
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
                                  <span className="text-[10px] text-[#0F172A]/30 font-body bg-white px-3 py-1 rounded-full">
                                    {formatDate(msg.createdAt)}
                                  </span>
                                </div>
                              )}
                              <MessageBubble message={msg} isOwn={isOwn} />
                            </div>
                          );
                        })}
                    </div>
                  )}

                  {/* Scroll anchor */}
                  <div ref={messagesEndRef} />
                </div>

                {/* Scroll to bottom floating button */}
                {showScrollBottomBtn && (
                  <button
                    onClick={scrollToBottom}
                    className="absolute bottom-20 right-6 w-10 h-10 rounded-full bg-white border border-[#E2E8F0] shadow-lg flex items-center justify-center text-[#0F172A]/60 hover:text-[#0284C7] hover:border-[#0284C7]/30 hover:shadow-xl transition-all duration-200 z-10"
                  >
                    <ChevronDown size={18} />
                  </button>
                )}

                {/* Message Input */}
                <div className="px-5 py-4 border-t border-[#E2E8F0] shrink-0">
                  <div className="flex items-end gap-3">
                    <div className="flex-1 relative">
                      <textarea
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Type your message..."
                        rows={1}
                        className="w-full px-4 py-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl text-sm text-[#0F172A] placeholder:text-[#0F172A]/30 focus:outline-none focus:border-[#0284C7] focus:bg-white transition-all font-body resize-none"
                        style={{ minHeight: 44, maxHeight: 120 }}
                      />
                    </div>
                    <button
                      onClick={handleSend}
                      disabled={!inputText.trim() || sending}
                      className="w-11 h-11 rounded-full bg-[#0284C7] text-white flex items-center justify-center hover:bg-[#0284C7]/90 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 shadow-sm shrink-0"
                    >
                      {sending ? (
                        <Loader2 size={18} className="animate-spin" />
                      ) : (
                        <Send size={18} />
                      )}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}