"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  MessageCircle, Mail, User, Search, Loader2, CheckCircle,
  XCircle, Clock, AlertCircle, ChevronDown
} from "lucide-react";
import { useAppSelector } from "@/redux/hooks";
import api from "@/lib/axios";

interface ContactInquiry {
  _id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: "NEW" | "RESOLVED";
  createdAt: string;
}

export default function AdminContactsPage() {
  const router = useRouter();
  const { user, accessToken, isCheckingAuth } = useAppSelector((state) => state.auth);

  const [contacts, setContacts] = useState<ContactInquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [toggling, setToggling] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Auth guard
  useEffect(() => {
    if (isCheckingAuth) return;
    if (!accessToken) { router.replace("/login"); return; }
    if (user && !user.isAdmin && user.role !== "admin") { router.replace("/explore"); }
  }, [accessToken, user, isCheckingAuth, router]);

  const fetchContacts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (filterStatus !== "all") params.set("status", filterStatus);
      if (searchQuery.trim()) params.set("search", searchQuery.trim());
      const res = await api.get(`/contact?${params.toString()}`);
      setContacts(res.data.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load contacts");
    } finally { setLoading(false); }
  }, [filterStatus, searchQuery]);

  useEffect(() => {
    if (!accessToken || !user) return;
    if (!user.isAdmin && user.role !== "admin") return;
    fetchContacts();
  }, [accessToken, user, fetchContacts]);

  const toggleResolved = useCallback(async (contactId: string) => {
    setToggling(contactId);
    try {
      const res = await api.patch(`/contact/${contactId}/resolve`);
      const updated = res.data.data;
      if (updated) {
        setContacts((prev) => prev.map((c) => c._id === contactId ? { ...c, status: updated.status } : c));
      }
    } catch { } finally { setToggling(null); }
  }, []);

  const formatDate = (d: string) => new Date(d).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

  return (
    <div className="min-h-screen bg-[#0a0d0c] p-6 pt-30">
      <div className="max-w-5xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-neutral-800 flex items-center justify-center"><MessageCircle size={20} className="text-[#ccff00]" /></div>
            <div>
              <h1 className="font-heading text-2xl font-bold text-white">Contact Messages</h1>
              <p className="text-sm text-neutral-400 font-body">Manage user inquiries and support requests</p>
            </div>
          </div>
        </motion.div>

        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none" />
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search by name, email, or subject..."
              className="w-full pl-9 pr-4 py-2.5 bg-neutral-800/80 border border-neutral-700 rounded-xl text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:border-[#ccff00] transition-all font-body" />
          </div>
          <div className="flex gap-1.5">
            {["all", "NEW", "RESOLVED"].map((tab) => (
              <button key={tab} onClick={() => setFilterStatus(tab)}
                className={`px-4 py-2 rounded-full text-xs font-body font-medium transition-all ${filterStatus === tab ? "bg-[#ccff00] text-black shadow-sm shadow-[#ccff00]/20" : "bg-neutral-900/80 border border-white/10 text-neutral-400 hover:text-white"}`}>
                {tab === "all" ? "All" : tab === "NEW" ? "New" : "Resolved"}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="bg-[#111614] rounded-3xl border border-white/10 p-12 text-center"><Loader2 size={24} className="animate-spin text-[#ccff00] mx-auto" /></div>
        ) : error ? (
          <div className="bg-[#111614] rounded-3xl border border-red-500/20 p-12 text-center"><AlertCircle size={32} className="mx-auto text-red-400 mb-3" /><p className="text-sm text-red-400 font-body">{error}</p></div>
        ) : contacts.length === 0 ? (
          <div className="bg-[#111614] rounded-3xl border border-white/10 p-12 text-center">
            <MessageCircle size={32} className="mx-auto text-[#ccff00]/30 mb-3" />
            <h3 className="font-heading text-lg font-semibold text-white mb-1">No inquiries found</h3>
            <p className="text-sm text-neutral-400 font-body">Contact messages from users will appear here.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {contacts.map((c, i) => (
              <motion.div key={c._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                className="bg-[#111614] rounded-2xl border border-white/10 overflow-hidden hover:shadow-md hover:shadow-black/20 transition-all">
                <div className="p-4 cursor-pointer" onClick={() => setExpandedId(expandedId === c._id ? null : c._id)}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-9 h-9 rounded-full bg-neutral-800 flex items-center justify-center shrink-0">
                        <span className="text-xs font-semibold text-white font-body">{c.name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)}</span>
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-white font-body truncate">{c.subject}</span>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${c.status === "NEW" ? "bg-amber-500/10 border-amber-500/20 text-amber-400" : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"}`}>
                            {c.status === "NEW" ? <Clock size={10} /> : <CheckCircle size={10} />}
                            {c.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-xs text-neutral-500 font-body">
                          <span className="truncate">{c.name}</span>
                          <span>·</span>
                          <span className="truncate">{c.email}</span>
                          <span>·</span>
                          <span>{formatDate(c.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); toggleResolved(c._id); }} disabled={toggling === c._id}
                      className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${c.status === "NEW" ? "bg-[#ccff00] border border-[#ccff00] text-black hover:bg-[#b8e600] font-semibold" : "bg-neutral-800/60 border border-white/10 text-neutral-300 hover:bg-neutral-700/60"}`}>
                      {toggling === c._id ? <Loader2 size={12} className="animate-spin" /> : c.status === "NEW" ? <CheckCircle size={12} /> : <XCircle size={12} />}
                      {c.status === "NEW" ? "Mark Resolved" : "Reopen"}
                    </button>
                  </div>
                </div>
                {expandedId === c._id && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} className="px-4 pb-4 pt-0 border-t border-white/10">
                    <p className="text-sm text-neutral-300 font-body mt-3 whitespace-pre-wrap">{c.message}</p>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
