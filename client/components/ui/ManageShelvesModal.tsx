"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Layers,
  Plus,
  Loader2,
  X,
  Save,
  Pencil,
  Trash2,
  Ruler,
  Package,
  AlertCircle,
  CheckCircle,
  ChevronDown,
  XCircle,
} from "lucide-react";
import { useAppSelector } from "@/redux/hooks";
import api from "@/lib/axios";

// ─── Types ──────────────────────────────────────────────────────────────────────

type ShelfStatus = "available" | "booked" | "maintenance";

interface ShelfData {
  _id: string;
  shelfNumber: string;
  status: ShelfStatus;
  pricePerMonth: number;
  dimensions?: string;
  capacity?: number | null;
  currentBooking?: string | null;
}

interface ManageShelvesModalProps {
  warehouseId: string;
  warehouseName: string;
  pricePerShelf: number;
  onClose: () => void;
  onUpdated: () => void;
}

// ─── Status badge helper ────────────────────────────────────────────────────────

function statusBadge(status: ShelfStatus) {
  const map: Record<ShelfStatus, { bg: string; text: string; dot: string; label: string }> = {
    available: { bg: "bg-[#84cc16]/10 border-[#84cc16]/20", text: "text-[#84cc16]", dot: "bg-[#84cc16]", label: "Available" },
    booked: { bg: "bg-amber-500/10 border-amber-500/20", text: "text-amber-400", dot: "bg-amber-500", label: "Booked" },
    maintenance: { bg: "bg-sky-500/10 border-sky-500/20", text: "text-sky-400", dot: "bg-sky-500", label: "Maintenance" },
  };
  const s = map[status] || map.available;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider border ${s.bg} ${s.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MANAGE SHELVES MODAL (Dark Glassmorphic)
// ═══════════════════════════════════════════════════════════════════════════════

export default function ManageShelvesModal({
  warehouseId,
  warehouseName,
  pricePerShelf,
  onClose,
  onUpdated,
}: ManageShelvesModalProps) {
  const { accessToken } = useAppSelector((state) => state.auth);

  // ─── State ──────────────────────────────────────────────────────────────
  const [shelves, setShelves] = useState<ShelfData[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);

  // Add form (bulk: number of shelves to add)
  const [addOpen, setAddOpen] = useState(false);
  const [addCount, setAddCount] = useState(1);
  const [adding, setAdding] = useState(false);

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editShelfNumber, setEditShelfNumber] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editDimensions, setEditDimensions] = useState("");
  const [editCapacity, setEditCapacity] = useState("");
  const [editStatus, setEditStatus] = useState<ShelfStatus>("available");
  const [savingEdit, setSavingEdit] = useState(false);

  // Delete state
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Toast
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  // ─── Fetch shelves ──────────────────────────────────────────────────────
  const fetchShelves = useCallback(async () => {
    if (!accessToken || !warehouseId) return;
    try {
      const res = await api.get(`/shelf/${warehouseId}`);
      const d = res.data.data;
      setShelves(d?.shelves || []);
      setFetchError(false);
    } catch {
      setFetchError(true);
    } finally {
      setLoading(false);
    }
  }, [accessToken, warehouseId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (cancelled) return;
      await fetchShelves();
    })();
    return () => {
      cancelled = true;
    };
  }, [fetchShelves]);

  // ─── Add shelves (bulk) ─────────────────────────────────────────────────
  const handleAddShelf = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!addCount || addCount < 1) {
        setToast({ message: "Enter at least 1 shelf to add", type: "error" });
        return;
      }
      setAdding(true);
      try {
        // Bulk-add: backend auto-generates shelves with the warehouse's default rate
        await api.post(`/shelf/add/${warehouseId}`, { numberOfShelves: addCount });
        setToast({ message: `${addCount} shelf${addCount !== 1 ? "ves" : ""} added successfully`, type: "success" });
        setAddCount(1);
        setAddOpen(false);
        fetchShelves();
        onUpdated();
      } catch (err: unknown) {
        const axiosErr = err as { response?: { data?: { message?: string } } };
        setToast({ message: axiosErr.response?.data?.message || "Failed to add shelves", type: "error" });
      } finally {
        setAdding(false);
      }
    },
    [addCount, warehouseId, fetchShelves, onUpdated]
  );

  // ─── Begin edit ─────────────────────────────────────────────────────────
  const beginEdit = useCallback((shelf: ShelfData) => {
    setEditingId(shelf._id);
    setEditShelfNumber(shelf.shelfNumber);
    setEditPrice(String(shelf.pricePerMonth ?? ""));
    setEditDimensions(shelf.dimensions || "");
    setEditCapacity(shelf.capacity ? String(shelf.capacity) : "");
    setEditStatus(shelf.status);
  }, []);

  // ─── Save edit ──────────────────────────────────────────────────────────
  const handleSaveEdit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!editingId || !editPrice || parseFloat(editPrice) <= 0) {
        setToast({ message: "Price per month must be greater than 0", type: "error" });
        return;
      }
      setSavingEdit(true);
      try {
        await api.patch(`/shelf/update/${editingId}`, {
          shelfNumber: editShelfNumber,
          pricePerMonth: parseFloat(editPrice),
          dimensions: editDimensions,
          capacity: editCapacity ? parseFloat(editCapacity) : null,
          status: editStatus,
        });
        setToast({ message: "Shelf updated successfully", type: "success" });
        setEditingId(null);
        fetchShelves();
        onUpdated();
      } catch (err: unknown) {
        const axiosErr = err as { response?: { data?: { message?: string } } };
        setToast({ message: axiosErr.response?.data?.message || "Failed to update shelf", type: "error" });
      } finally {
        setSavingEdit(false);
      }
    },
    [editingId, editShelfNumber, editPrice, editDimensions, editCapacity, editStatus, fetchShelves, onUpdated]
  );

  // ─── Delete shelf ───────────────────────────────────────────────────────
  const handleDelete = useCallback(async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await api.delete(`/shelf/single/${deleteId}`);
      setToast({ message: "Shelf deleted successfully", type: "success" });
      setDeleteId(null);
      fetchShelves();
      onUpdated();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setToast({ message: axiosErr.response?.data?.message || "Failed to delete shelf", type: "error" });
    } finally {
      setDeleting(false);
    }
  }, [deleteId, fetchShelves, onUpdated]);

  const availableCount = shelves.filter((s) => s.status === "available").length;
  const bookedCount = shelves.filter((s) => s.status === "booked").length;
  const maintenanceCount = shelves.filter((s) => s.status === "maintenance").length;

  // ─── Dark input class ───────────────────────────────────────────────────
  const inputCls =
    "w-full px-3.5 py-2.5 bg-neutral-900/80 border border-neutral-700 text-white placeholder-neutral-500 focus:border-[#84cc16] focus:outline-none focus:ring-1 focus:ring-[#84cc16]/30 rounded-xl transition-all text-sm font-body";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[60] flex items-start justify-center p-4 pt-14 sm:pt-20 bg-black/70 backdrop-blur-sm overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="w-full max-w-3xl bg-[#111614]/95 backdrop-blur-xl border border-neutral-800 text-white rounded-3xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/10 border border-neutral-800 flex items-center justify-center text-neutral-400 hover:bg-white/20 hover:text-white transition-all duration-200 z-20"
        >
          <X size={16} />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 px-6 sm:px-8 pt-6 pb-4 border-b border-neutral-800/80">
          <div className="w-10 h-10 rounded-xl bg-[#84cc16]/10 border border-[#84cc16]/20 flex items-center justify-center shrink-0">
            <Layers size={20} className="text-[#84cc16]" />
          </div>
          <div className="min-w-0">
            <h2 className="font-heading text-xl font-bold text-white tracking-tight">Manage Shelves</h2>
            <p className="text-sm text-neutral-400 font-body truncate">{warehouseName}</p>
          </div>
        </div>

        {/* Toast */}
        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`mx-6 sm:mx-8 mt-4 px-4 py-3 rounded-2xl border flex items-center gap-2.5 ${
                toast.type === "success"
                  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-300"
                  : "bg-red-500/10 border-red-500/20 text-red-300"
              }`}
            >
              {toast.type === "success" ? <CheckCircle size={16} className="shrink-0" /> : <AlertCircle size={16} className="shrink-0" />}
              <span className="text-xs font-body font-semibold">{toast.message}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Body */}
        <div className="px-6 sm:px-8 py-6 max-h-[calc(100vh-240px)] overflow-y-auto">
          {/* Stats strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {[
              { label: "Total", value: shelves.length, cls: "text-white" },
              { label: "Available", value: availableCount, cls: "text-[#84cc16]" },
              { label: "Booked", value: bookedCount, cls: "text-amber-400" },
              { label: "Maintenance", value: maintenanceCount, cls: "text-sky-400" },
            ].map((s) => (
              <div key={s.label} className="p-3 rounded-2xl bg-neutral-900/80 border border-neutral-800 text-center">
                <p className={`font-heading text-xl font-bold numeric ${s.cls}`}>{s.value}</p>
                <p className="text-[10px] text-neutral-400 uppercase tracking-wider font-body mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Add Shelf toggle + form */}
          <div className="mb-6">
            <button
              onClick={() => setAddOpen((o) => !o)}
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 bg-[#1a231d] text-[#84cc16] border border-[#84cc16]/40 rounded-full font-body text-sm font-semibold hover:bg-[#222e26] hover:border-[#84cc16]/60 hover:shadow-lg hover:shadow-[#84cc16]/10 active:scale-[0.98] transition-all duration-200"
            >
              {addOpen ? <ChevronDown size={16} className="rotate-180 transition-transform" /> : <Plus size={16} />}
              {addOpen ? "Close Add Shelf" : "Add New Shelf"}
            </button>

            <AnimatePresence>
              {addOpen && (
                <motion.form
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25 }}
                  onSubmit={handleAddShelf}
                  className="overflow-hidden"
                >
                  <div className="mt-4 p-5 rounded-2xl bg-neutral-900/60 border border-neutral-800 space-y-4">
                    <div>
                      <label className="text-[10px] font-semibold tracking-wider text-neutral-400 uppercase mb-1.5 block font-body">
                        Number of Shelves to Add
                      </label>
                      <div className="relative">
                        <Layers size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#84cc16]/60 pointer-events-none" />
                        <input
                          type="number"
                          min={1}
                          value={addCount}
                          onChange={(e) => setAddCount(Math.max(1, parseInt(e.target.value) || 1))}
                          placeholder="Enter number of shelves to add"
                          className={`${inputCls} pl-10 [color-scheme:dark]`}
                        />
                      </div>
                      <p className="text-[11px] text-neutral-500 font-body mt-1.5">
                        Shelves are auto-numbered and priced at the warehouse default rate (Rs.{" "}
                        {(pricePerShelf || 0).toLocaleString("en-PK")}/month each).
                      </p>
                    </div>
                    <div className="flex items-center gap-3 pt-1">
                      <button
                        type="submit"
                        disabled={adding}
                        className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 bg-[#1a231d] text-[#84cc16] border border-[#84cc16]/40 rounded-full font-body text-sm font-semibold hover:bg-[#222e26] hover:border-[#84cc16]/60 active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {adding ? <><Loader2 size={16} className="animate-spin" /> Adding...</> : <><Plus size={16} /> Add Shelves</>}
                      </button>
                    </div>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>
          </div>

          {/* Shelves list */}
          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 bg-neutral-900/60 rounded-2xl border border-neutral-800 animate-pulse" />
              ))}
            </div>
          ) : fetchError ? (
            <div className="text-center py-12">
              <AlertCircle size={28} className="mx-auto text-red-400 mb-3" />
              <p className="text-sm text-neutral-400 font-body">Couldn&apos;t load shelves. Please try again.</p>
            </div>
          ) : shelves.length === 0 ? (
            <div className="text-center py-12 bg-neutral-900/40 rounded-3xl border border-neutral-800">
              <div className="w-14 h-14 rounded-2xl bg-neutral-800/60 flex items-center justify-center mx-auto mb-4">
                <Layers size={26} className="text-[#84cc16]/40" />
              </div>
              <h3 className="font-heading text-lg font-semibold text-white mb-1">No shelves yet</h3>
              <p className="text-sm text-neutral-400 font-body mb-6">Add your first shelf to start listing storage space.</p>
              <button
                onClick={() => setAddOpen(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#1a231d] text-[#84cc16] border border-[#84cc16]/40 rounded-full text-sm font-semibold hover:bg-[#222e26] hover:border-[#84cc16]/60 transition-all"
              >
                <Plus size={16} /> Add First Shelf
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              <div className="hidden sm:grid grid-cols-[1fr_110px_130px_140px_130px] gap-2 px-4 py-2 bg-neutral-900/80 rounded-xl border border-neutral-800 mb-1">
                <span className="text-[10px] font-semibold tracking-wider text-neutral-400 uppercase font-body">Shelf</span>
                <span className="text-[10px] font-semibold tracking-wider text-neutral-400 uppercase font-body">Status</span>
                <span className="text-[10px] font-semibold tracking-wider text-neutral-400 uppercase font-body text-right">Rate / Mo</span>
                <span className="text-[10px] font-semibold tracking-wider text-neutral-400 uppercase font-body">Details</span>
                <span className="text-[10px] font-semibold tracking-wider text-neutral-400 uppercase font-body text-right">Actions</span>
              </div>

              {shelves.map((shelf) => {
                const isEditing = editingId === shelf._id;
                const isDeleting = deleteId === shelf._id;
                return (
                  <motion.div
                    key={shelf._id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-2xl border border-neutral-800 bg-neutral-900/60 hover:bg-neutral-900/80 hover:border-[#84cc16]/30 transition-all duration-200 overflow-hidden"
                  >
                    {isEditing ? (
                      <form onSubmit={handleSaveEdit} className="p-4 space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="text-[10px] font-semibold tracking-wider text-neutral-400 uppercase mb-1 block font-body">Shelf Number</label>
                            <input type="text" value={editShelfNumber} onChange={(e) => setEditShelfNumber(e.target.value)} className={inputCls} />
                          </div>
                          <div>
                            <label className="text-[10px] font-semibold tracking-wider text-neutral-400 uppercase mb-1 block font-body">Price / Mo (Rs.)</label>
                            <input type="number" min={0} value={editPrice} onChange={(e) => setEditPrice(e.target.value)} className={`${inputCls} [color-scheme:dark]`} />
                          </div>
                          <div>
                            <label className="text-[10px] font-semibold tracking-wider text-neutral-400 uppercase mb-1 block font-body">Dimensions</label>
                            <input type="text" value={editDimensions} onChange={(e) => setEditDimensions(e.target.value)} className={inputCls} />
                          </div>
                          <div>
                            <label className="text-[10px] font-semibold tracking-wider text-neutral-400 uppercase mb-1 block font-body">Capacity (kg)</label>
                            <input type="number" min={0} value={editCapacity} onChange={(e) => setEditCapacity(e.target.value)} className={`${inputCls} [color-scheme:dark]`} />
                          </div>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                          <div className="flex-1">
                            <label className="text-[10px] font-semibold tracking-wider text-neutral-400 uppercase mb-1 block font-body">Status</label>
                            <select
                              value={editStatus}
                              onChange={(e) => setEditStatus(e.target.value as ShelfStatus)}
                              disabled={shelf.status === "booked"}
                              className={`${inputCls} cursor-pointer disabled:opacity-50 ${editStatus === "available" ? "text-emerald-400" : editStatus === "booked" ? "text-amber-400" : "text-sky-400"}`}
                            >
                              <option value="available" className="text-white">Available</option>
                              <option value="booked" className="text-white">Booked</option>
                              <option value="maintenance" className="text-white">Maintenance</option>
                            </select>
                          </div>
                          <div className="flex items-center gap-2 pt-4">
                            <button
                              type="button"
                              onClick={() => setEditingId(null)}
                              disabled={savingEdit}
                              className="px-4 py-2.5 rounded-full border border-neutral-700 text-neutral-400 text-xs font-medium hover:bg-white/5 transition-all disabled:opacity-50"
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              disabled={savingEdit}
                              className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-[#1a231d] text-[#84cc16] border border-[#84cc16]/40 rounded-full text-xs font-semibold hover:bg-[#222e26] hover:border-[#84cc16]/60 transition-all disabled:opacity-50"
                            >
                              {savingEdit ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                              Save
                            </button>
                          </div>
                        </div>
                      </form>
                    ) : (
                      <div className="p-4">
                        <div className="sm:hidden flex items-center justify-between mb-2">
                          <span className="font-semibold text-sm text-white font-body">{shelf.shelfNumber}</span>
                          {statusBadge(shelf.status)}
                        </div>
                        <div className="hidden sm:grid grid-cols-[1fr_110px_130px_140px_130px] gap-2 items-center">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${shelf.status === "available" ? "bg-[#84cc16]/10" : shelf.status === "booked" ? "bg-amber-500/10" : "bg-sky-500/10"}`}>
                              <Layers size={15} className={shelf.status === "available" ? "text-[#84cc16]" : shelf.status === "booked" ? "text-amber-400" : "text-sky-400"} />
                            </div>
                            <span className="font-semibold text-sm text-white font-body truncate">{shelf.shelfNumber}</span>
                          </div>
                          <div>{statusBadge(shelf.status)}</div>
                          <div className="text-right">
                            <span className="text-sm font-semibold text-white font-body numeric">Rs. {(shelf.pricePerMonth ?? 0).toLocaleString("en-PK")}</span>
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 text-[11px] text-neutral-400 font-body truncate">
                              {shelf.dimensions && <><Ruler size={11} className="shrink-0 text-[#84cc16]/60" /><span className="truncate">{shelf.dimensions}</span></>}
                            </div>
                            <div className="flex items-center gap-1.5 text-[11px] text-neutral-500 font-body">
                              {shelf.capacity ? <><Package size={11} className="shrink-0 text-[#84cc16]/40" /><span>{shelf.capacity} kg</span></> : <span className="italic">no details</span>}
                            </div>
                          </div>
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => beginEdit(shelf)}
                              className="w-8 h-8 rounded-lg border border-neutral-700 text-neutral-400 hover:text-[#84cc16] hover:border-[#84cc16]/40 hover:bg-[#84cc16]/5 flex items-center justify-center transition-all"
                              title="Edit shelf"
                            >
                              <Pencil size={13} />
                            </button>
                            <button
                              onClick={() => setDeleteId(shelf._id)}
                              disabled={shelf.status === "booked"}
                              className="w-8 h-8 rounded-lg border border-neutral-700 text-neutral-400 hover:text-red-400 hover:border-red-500/40 hover:bg-red-500/5 flex items-center justify-center transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                              title={shelf.status === "booked" ? "Booked shelves cannot be deleted" : "Delete shelf"}
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>

                        {/* Mobile actions */}
                        <div className="sm:hidden flex items-center gap-2 pt-2 border-t border-neutral-800/70 mt-2">
                          <button onClick={() => beginEdit(shelf)} className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 border border-neutral-700 text-neutral-300 rounded-full text-xs hover:border-[#84cc16]/40 hover:text-[#84cc16] transition-all">
                            <Pencil size={12} /> Edit
                          </button>
                          <button
                            onClick={() => setDeleteId(shelf._id)}
                            disabled={shelf.status === "booked"}
                            className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 border border-neutral-700 text-neutral-300 rounded-full text-xs hover:border-red-500/40 hover:text-red-400 transition-all disabled:opacity-40"
                          >
                            <Trash2 size={12} /> Delete
                          </button>
                        </div>

                        {/* Delete confirm inline */}
                        <AnimatePresence>
                          {isDeleting && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="mt-3 pt-3 border-t border-red-500/20 flex flex-col sm:flex-row sm:items-center gap-3">
                                <p className="text-xs text-neutral-300 font-body flex items-center gap-2 flex-1">
                                  <AlertCircle size={14} className="text-red-400 shrink-0" />
                                  Delete <span className="font-semibold text-white">{shelf.shelfNumber}</span>? This cannot be undone.
                                </p>
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => setDeleteId(null)}
                                    disabled={deleting}
                                    className="px-4 py-2 rounded-full border border-neutral-700 text-neutral-400 text-xs hover:bg-white/5 transition-all disabled:opacity-50"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    onClick={handleDelete}
                                    disabled={deleting}
                                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-500/15 border border-red-500/30 text-red-400 rounded-full text-xs font-semibold hover:bg-red-500/25 transition-all disabled:opacity-50"
                                  >
                                    {deleting ? <Loader2 size={13} className="animate-spin" /> : <XCircle size={13} />}
                                    Delete
                                  </button>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
