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
    <div className="min-h-screen bg-[#F8FAFC] p-6">
      <div className="max-w-5xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#F8FAFC] flex items-center justify-center"><MessageCircle size={20} className="text-[#0284C7]" /></div>
            <div>
              <h1 className="font-heading text-2xl font-bold text-[#1E293B]">Contact Messages</h1>
              <p className="text-sm text-[#0F172A]/50 font-body">Manage user inquiries and support requests</p>
            </div>
          </div>
        </motion.div>

        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#0F172A]/30 pointer-events-none" />
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search by name, email, or subject..."
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-[#E2E8F0] rounded-xl text-sm text-[#0F172A] placeholder:text-[#0F172A]/30 focus:outline-none focus:border-[#0284C7] transition-all font-body" />
          </div>
          <div className="flex gap-1.5">
            {["all", "NEW", "RESOLVED"].map((tab) => (
              <button key={tab} onClick={() => setFilterStatus(tab)}
                className={`px-4 py-2 rounded-full text-xs font-body font-medium transition-all ${filterStatus === tab ? "bg-[#1E293B] text-white shadow-sm" : "bg-white border border-[#E2E8F0] text-[#0F172A]/50 hover:text-[#0F172A]"}`}>
                {tab === "all" ? "All" : tab === "NEW" ? "New" : "Resolved"}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="bg-white rounded-3xl border border-[#E2E8F0] p-12 text-center"><Loader2 size={24} className="animate-spin text-[#0284C7] mx-auto" /></div>
        ) : error ? (
          <div className="bg-white rounded-3xl border border-red-200 p-12 text-center"><AlertCircle size={32} className="mx-auto text-red-400 mb-3" /><p className="text-sm text-red-600 font-body">{error}</p></div>
        ) : contacts.length === 0 ? (
          <div className="bg-white rounded-3xl border border-[#E2E8F0] p-12 text-center">
            <MessageCircle size={32} className="mx-auto text-[#0284C7]/30 mb-3" />
            <h3 className="font-heading text-lg font-semibold text-[#1E293B] mb-1">No inquiries found</h3>
            <p className="text-sm text-[#0F172A]/50 font-body">Contact messages from users will appear here.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {contacts.map((c, i) => (
              <motion.div key={c._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden hover:shadow-sm transition-all">
                <div className="p-4 cursor-pointer" onClick={() => setExpandedId(expandedId === c._id ? null : c._id)}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-9 h-9 rounded-full bg-[#1E293B] flex items-center justify-center shrink-0">
                        <span className="text-xs font-semibold text-white font-body">{c.name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)}</span>
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-[#1E293B] font-body truncate">{c.subject}</span>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${c.status === "NEW" ? "bg-amber-50 border-amber-200 text-amber-700" : "bg-emerald-50 border-emerald-200 text-emerald-700"}`}>
                            {c.status === "NEW" ? <Clock size={10} /> : <CheckCircle size={10} />}
                            {c.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-xs text-[#0F172A]/40 font-body">
                          <span className="truncate">{c.name}</span>
                          <span>·</span>
                          <span className="truncate">{c.email}</span>
                          <span>·</span>
                          <span>{formatDate(c.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); toggleResolved(c._id); }} disabled={toggling === c._id}
                      className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${c.status === "NEW" ? "bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100" : "bg-[#F8FAFC] border border-[#E2E8F0] text-[#0F172A]/50 hover:bg-white"}`}>
                      {toggling === c._id ? <Loader2 size={12} className="animate-spin" /> : c.status === "NEW" ? <CheckCircle size={12} /> : <XCircle size={12} />}
                      {c.status === "NEW" ? "Mark Resolved" : "Reopen"}
                    </button>
                  </div>
                </div>
                {expandedId === c._id && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} className="px-4 pb-4 pt-0 border-t border-[#E2E8F0]">
                    <p className="text-sm text-[#0F172A]/70 font-body mt-3 whitespace-pre-wrap">{c.message}</p>
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
