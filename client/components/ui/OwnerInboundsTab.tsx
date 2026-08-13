"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2,
  Loader2,
  AlertCircle,
  Package,
  Clock,
  CheckCircle,
  MapPin,
  Inbox,
  ChevronRight,
  ChevronLeft,
  Truck,
  Hash,
  Box,
  Layers,
  CalendarDays,
  X,
} from "lucide-react";
import { useAppSelector } from "@/redux/hooks";
import api from "@/lib/axios";
import ConfirmationModal from "@/components/ui/ConfirmationModal";

// ─── Types ──────────────────────────────────────────────────────────────────────

interface OwnedWarehouse {
  _id: string;
  name: string;
  location: string;
  totalShelves?: number;
  pricePerShelf?: number;
}

interface CartonContent {
  cartonNumber: string;
  items: Array<{ itemName: string; sku?: string; quantity: number }>;
  status: "In Storage" | "Unpacked" | "Dispatched";
  totalItemsCount: number;
}

interface OwnerPlan {
  _id: string;
  merchant: string;
  warehouse: string;
  booking: string;
  batchName: string;
  totalCartons: number;
  receivedCount?: number;
  expectedDate: string;
  status: "in-transit" | "arrived" | "completed" | "cancelled";
  createdAt: string;
  merchantName?: string | null;
  warehouseName?: string | null;
  warehouseLocation?: string | null;
  cartons?: CartonContent[];
  stock?: Array<{
    itemName: string;
    sku?: string;
    initialUnits: number;
    dispatchedUnits: number;
    availableUnits: number;
  }>;
  cartonStats?: Array<{ _id: string; count: number }>;
}

// ─── Status badge (uppercase labels per spec: IN_TRANSIT / ARRIVED) ─────────────

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { bg: string; text: string; dot: string; label: string }> = {
    "in-transit": { bg: "bg-sky-500/10 border-sky-500/20", text: "text-sky-400", dot: "bg-sky-500", label: "IN TRANSIT" },
    arrived: { bg: "bg-emerald-500/10 border-emerald-500/20", text: "text-emerald-400", dot: "bg-emerald-500", label: "ARRIVED" },
    completed: { bg: "bg-neutral-500/10 border-neutral-500/20", text: "text-neutral-400", dot: "bg-neutral-500", label: "COMPLETED" },
    cancelled: { bg: "bg-red-500/10 border-red-500/20", text: "text-red-400", dot: "bg-red-500", label: "CANCELLED" },
  };

  const c = config[status] || config["in-transit"];

  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-[10px] font-body font-semibold uppercase tracking-wider ${c.bg} ${c.text}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  );
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" });
}

function CartonBadge({ status }: { status: CartonContent["status"] }) {
  const map: Record<string, string> = {
    "In Storage": "bg-[#84cc16]/10 border-[#84cc16]/30 text-[#84cc16]",
    Unpacked: "bg-amber-500/10 border-amber-500/30 text-amber-400",
    Dispatched: "bg-sky-500/10 border-sky-500/30 text-sky-400",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider border ${
        map[status] || "bg-neutral-500/10 border-neutral-500/30 text-neutral-400"
      }`}
    >
      {status === "Dispatched" ? <Truck size={10} /> : <Box size={10} />}
      {status}
    </span>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB — Warehouse Owner Inbound Management
// Flow: Warehouses grid → warehouse inbound plans → plan detail (+ Mark as Arrived)
// ═══════════════════════════════════════════════════════════════════════════════

export default function OwnerInboundsTab() {
  const { accessToken, user } = useAppSelector((s) => s.auth);
  const isOwner = user?.role === "warehouseOwner";

  // ─── View state ──────────────────────────────────────────────────────────
  const [warehouses, setWarehouses] = useState<OwnedWarehouse[]>([]);
  const [warehousesLoading, setWarehousesLoading] = useState(true);
  const [warehousesError, setWarehousesError] = useState(false);
  const [warehousesRetry, setWarehousesRetry] = useState(0);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string | null>(null);
  const [plans, setPlans] = useState<OwnerPlan[]>([]);
  const [plansLoading, setPlansLoading] = useState(false);
  const [plansError, setPlansError] = useState(false);
  const [activePlan, setActivePlan] = useState<OwnerPlan | null>(null);
  const [expandedCartons, setExpandedCartons] = useState<Set<string>>(new Set());

  // ─── Arrival action state ────────────────────────────────────────────────
  const [confirmPlan, setConfirmPlan] = useState<OwnerPlan | null>(null);
  const [markingArrived, setMarkingArrived] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  // ─── Fetch owned warehouses (spec: GET /owner/warehouses) ───────────────
  useEffect(() => {
    if (!accessToken || !isOwner) return;
    let cancelled = false;
    (async () => {
      setWarehousesLoading(true);
      try {
        const res = await api.get("/owner/warehouses");
        const d = res.data.data;
        if (!cancelled) {
          setWarehouses(Array.isArray(d?.warehouses) ? d.warehouses : []);
          setWarehousesError(false);
        }
      } catch {
        if (!cancelled) setWarehousesError(true);
      } finally {
        if (!cancelled) setWarehousesLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [accessToken, isOwner, warehousesRetry]);

  // ─── Fetch inbound plans for the selected warehouse (spec: GET /owner/warehouses/:id/inbounds) ──
  const fetchPlans = useCallback(async () => {
    if (!accessToken || !selectedWarehouseId) return;
    setPlansLoading(true);
    setPlansError(false);
    try {
      const res = await api.get(`/owner/warehouses/${selectedWarehouseId}/inbounds`);
      const d = res.data.data;
      setPlans(Array.isArray(d?.plans) ? d.plans : []);
    } catch {
      setPlansError(true);
    } finally {
      setPlansLoading(false);
    }
  }, [accessToken, selectedWarehouseId]);

  useEffect(() => {
    if (!accessToken || !isOwner || !selectedWarehouseId) return;
    (async () => {
      await fetchPlans();
    })();
  }, [accessToken, isOwner, selectedWarehouseId, fetchPlans]);

  // ─── Mark shipment as ARRIVED (spec: PATCH /owner/inbounds/:id/status) ───
  const handleConfirmArrival = useCallback(async () => {
    if (!confirmPlan) return;
    setMarkingArrived(true);
    try {
      await api.patch(`/owner/inbounds/${confirmPlan._id}/status`, { status: "ARRIVED" });
      const arrived: OwnerPlan = { ...confirmPlan, status: "arrived", receivedCount: confirmPlan.totalCartons };
      setActivePlan(arrived);
      setPlans((prev) => prev.map((p) => (p._id === arrived._id ? arrived : p)));
      setToast({ message: "Shipment marked as arrived — the merchant can now create orders.", type: "success" });
    } catch (err) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Failed to mark shipment as arrived";
      setToast({ message: msg, type: "error" });
    } finally {
      setMarkingArrived(false);
      setConfirmPlan(null);
    }
  }, [confirmPlan]);

  const toggleCarton = useCallback((key: string) => {
    setExpandedCartons((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  // ─── Derived stats (plans view) ─────────────────────────────────────────
  const stats = useMemo(() => {
    const cartonsPending = plans
      .filter((p) => p.status === "in-transit")
      .reduce((sum, p) => sum + p.totalCartons, 0);
    const arrived = plans.filter((p) => p.status === "arrived" || p.status === "completed").length;
    return { totalBatches: plans.length, cartonsPending, arrived };
  }, [plans]);

  const selectedWarehouse = warehouses.find((w) => w._id === selectedWarehouseId) || null;

  // ─── Access guards ───────────────────────────────────────────────────────
  if (!user) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 size={28} className="animate-spin text-[#84cc16]" />
      </div>
    );
  }

  if (!isOwner) {
    return (
      <div className="text-center py-16 bg-[#111614]/90 backdrop-blur-md rounded-3xl border border-neutral-800/80 shadow-sm">
        <div className="w-16 h-16 rounded-2xl bg-neutral-800/60 flex items-center justify-center mx-auto mb-4">
          <Building2 size={28} className="text-[#84cc16]/40" />
        </div>
        <h3 className="font-heading text-lg font-semibold text-white mb-2">Warehouse Owners Only</h3>
        <p className="text-sm text-neutral-400 font-body max-w-sm mx-auto">
          Inbound management is available to warehouse owners. Sign in with an owner account to view incoming shipments.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* ═══ VIEW 1: WAREHOUSES GRID ═══ */}
      {!selectedWarehouseId && (
        <div>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6 bg-[#111614]/90 backdrop-blur-md p-4 rounded-xl border border-neutral-800"
          >
            <div>
              <h2 className="text-lg font-semibold text-white">Select a Warehouse</h2>
              <p className="text-xs text-neutral-400">Choose one of your warehouses to view its inbound shipments and verify arrivals.</p>
            </div>
          </motion.div>

          {warehousesError ? (
            <div className="text-center py-16 bg-[#111614]/90 backdrop-blur-md rounded-3xl border border-neutral-800/80 shadow-sm">
              <AlertCircle size={32} className="mx-auto text-red-400/50 mb-3" />
              <h3 className="font-heading text-base font-semibold text-white mb-2">Failed to load your warehouses</h3>
              <p className="text-sm text-neutral-400 font-body mb-6">There was an error fetching your warehouse list.</p>
              <button
                onClick={() => setWarehousesRetry((k) => k + 1)}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1a231d] text-[#84cc16] border border-[#84cc16]/40 rounded-full text-sm font-semibold hover:bg-[#222e26] hover:border-[#84cc16]/60 transition-all"
              >
                <Loader2 size={14} className={warehousesLoading ? "animate-spin" : ""} /> Retry
              </button>
            </div>
          ) : warehousesLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-[#111614] rounded-3xl h-44 border border-neutral-800/80 animate-pulse" />
              ))}
            </div>
          ) : warehouses.length === 0 ? (
            <div className="text-center py-16 bg-[#111614]/90 backdrop-blur-md rounded-3xl border border-neutral-800/80 shadow-sm">
              <div className="w-16 h-16 rounded-2xl bg-neutral-800/60 flex items-center justify-center mx-auto mb-4">
                <Building2 size={28} className="text-[#84cc16]/40" />
              </div>
              <h3 className="font-heading text-lg font-semibold text-white mb-2">No warehouses yet</h3>
              <p className="text-sm text-neutral-400 font-body max-w-sm mx-auto">
                Create a warehouse listing first — inbound shipments will appear here once merchants book your space.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {warehouses.map((w, i) => (
                <motion.button
                  key={w._id}
                  type="button"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.06 }}
                  onClick={() => {
                    setSelectedWarehouseId(w._id);
                    setActivePlan(null);
                  }}
                  className="group text-left bg-[#111614]/90 backdrop-blur-md border border-neutral-800/80 rounded-3xl p-5 shadow-[0_8px_30px_rgba(0,0,0,0.4)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.5)] hover:-translate-y-1 hover:border-[#84cc16]/40 transition-all duration-300 flex flex-col"
                >
                  <div className="h-2 bg-gradient-to-r from-[#84cc16] to-[#84cc16]/40 -mx-5 -mt-5 mb-4 rounded-t-3xl" />
                  <div className="flex items-start justify-between gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-neutral-800/60 flex items-center justify-center shrink-0">
                      <Building2 size={20} className="text-[#84cc16]" />
                    </div>
                    <ChevronRight size={18} className="text-neutral-600 group-hover:text-[#84cc16] group-hover:translate-x-0.5 transition-all duration-200" />
                  </div>
                  <h3 className="font-heading text-lg font-semibold text-white mt-3 truncate">{w.name}</h3>
                  <div className="flex items-center gap-1.5 text-xs text-neutral-400 font-body mt-0.5">
                    <MapPin size={12} />
                    <span className="truncate">{w.location || "—"}</span>
                  </div>
                  <div className="mt-auto pt-4 flex items-center gap-2 text-[11px] text-neutral-500 font-body">
                    <Layers size={12} className="text-[#84cc16]/60" />
                    <span>{w.totalShelves ?? 0} shelves</span>
                    <span className="text-neutral-700">·</span>
                    <span className="inline-flex items-center gap-1 text-[#84cc16] font-medium">
                      <Package size={12} /> View Inbounds
                    </span>
                  </div>
                </motion.button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ═══ VIEW 2: WAREHOUSE INBOUND PLANS ═══ */}
      {selectedWarehouseId && !activePlan && (
        <div>
          <button
            type="button"
            onClick={() => setSelectedWarehouseId(null)}
            className="inline-flex items-center gap-1.5 text-sm text-neutral-400 hover:text-white font-body transition-colors mb-5"
          >
            <ChevronLeft size={16} /> All Warehouses
          </button>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex items-center gap-3 mb-6"
          >
            <div className="w-11 h-11 rounded-2xl bg-[#84cc16]/10 border border-[#84cc16]/30 flex items-center justify-center shrink-0">
              <Building2 size={20} className="text-[#84cc16]" />
            </div>
            <div>
              <h2 className="font-heading text-xl font-semibold text-white">{selectedWarehouse?.name || "Warehouse"}</h2>
              <div className="flex items-center gap-1.5 text-xs text-neutral-400 font-body">
                <MapPin size={11} />
                <span>{selectedWarehouse?.location || "—"}</span>
              </div>
            </div>
          </motion.div>

          {/* Stat cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            {[
              { icon: Package, label: "Total Batches", value: stats.totalBatches },
              { icon: Clock, label: "Cartons Pending", value: stats.cartonsPending },
              { icon: CheckCircle, label: "Arrived", value: stats.arrived },
            ].map((k, i) => (
              <motion.div
                key={k.label}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.05 + i * 0.05 }}
                className="bg-[#111614]/90 backdrop-blur-md rounded-2xl p-5 border border-neutral-800/80 shadow-sm hover:shadow-md hover:border-[#84cc16]/40 hover:-translate-y-0.5 transition-all duration-300"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-neutral-800 to-neutral-900 flex items-center justify-center">
                    <k.icon size={20} className="text-[#84cc16]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-heading text-2xl font-bold text-white numeric tracking-tight">{k.value}</p>
                    <p className="text-xs text-neutral-400 font-body mt-0.5">{k.label}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Plans table */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="bg-[#111614]/90 backdrop-blur-md rounded-3xl border border-neutral-800/80 shadow-sm overflow-hidden"
          >
            {plansError ? (
              <div className="text-center py-16 px-6">
                <AlertCircle size={32} className="mx-auto text-red-400/50 mb-3" />
                <h3 className="font-heading text-base font-semibold text-white mb-2">Failed to load inbound plans</h3>
                <p className="text-sm text-neutral-400 font-body mb-6">There was an error fetching inbound data for this warehouse.</p>
                <button
                  onClick={fetchPlans}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1a231d] text-[#84cc16] border border-[#84cc16]/40 rounded-full text-sm font-semibold hover:bg-[#222e26] hover:border-[#84cc16]/60 transition-all"
                >
                  <Loader2 size={14} className={plansLoading ? "animate-spin" : ""} /> Retry
                </button>
              </div>
            ) : plansLoading ? (
              <div className="p-6 space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-14 bg-neutral-800/60 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : plans.length === 0 ? (
              <div className="text-center py-16 px-6">
                <div className="w-16 h-16 rounded-2xl bg-neutral-800/60 flex items-center justify-center mx-auto mb-4">
                  <Inbox size={28} className="text-[#84cc16]/40" />
                </div>
                <h3 className="font-heading text-base font-semibold text-white mb-2">No inbound shipments</h3>
                <p className="text-sm text-neutral-400 font-body max-w-sm mx-auto">
                  No incoming batches for this warehouse yet. Merchants create inbound plans after their booking is confirmed.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-neutral-800/80">
                {plans.map((plan, i) => {
                  const arrived = plan.status === "arrived" || plan.status === "completed";
                  return (
                    <motion.div
                      key={plan._id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: Math.min(i * 0.03, 0.3) }}
                      onClick={() => setActivePlan(plan)}
                      className="px-5 sm:px-6 py-4 hover:bg-white/5 transition-colors duration-200 cursor-pointer"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2.5 mb-1 flex-wrap">
                            <span className="font-semibold text-sm text-white font-body">{plan.batchName}</span>
                            <StatusBadge status={plan.status} />
                          </div>
                          <div className="flex items-center gap-3 text-xs text-neutral-400 font-body flex-wrap">
                            <span className="inline-flex items-center gap-1"><Box size={12} />{plan.totalCartons} cartons</span>
                            <span>·</span>
                            <span className="inline-flex items-center gap-1"><CalendarDays size={12} />Expected: {formatDate(plan.expectedDate)}</span>
                            {plan.merchantName && (
                              <>
                                <span>·</span>
                                <span className="inline-flex items-center gap-1">Merchant: {plan.merchantName}</span>
                              </>
                            )}
                          </div>
                          {plan.cartonStats && plan.cartonStats.length > 0 && (
                            <div className="flex items-center gap-3 mt-2 text-[11px] text-neutral-400 font-body">
                              {(plan.cartonStats || []).map((s) => (
                                <span key={s._id || "x"} className="inline-flex items-center gap-1">
                                  <span className={`w-2 h-2 rounded-full ${s._id === "in-transit" ? "bg-amber-400" : "bg-emerald-400"}`} />
                                  {s.count} {s._id === "in-transit" ? "in transit" : s._id}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                          {!arrived && plan.status !== "cancelled" ? (
                            <button
                              type="button"
                              onClick={() => setConfirmPlan(plan)}
                              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#1a231d] text-[#84cc16] border border-[#84cc16]/40 rounded-full text-xs font-semibold hover:bg-[#222e26] hover:border-[#84cc16]/60 hover:shadow-lg hover:shadow-[#84cc16]/10 active:scale-95 transition-all duration-200 whitespace-nowrap"
                            >
                              <Truck size={13} /> Mark as Arrived
                            </button>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-semibold uppercase tracking-wider">
                              <CheckCircle size={11} /> Arrived
                            </span>
                          )}
                          <ChevronRight size={14} className="text-neutral-600" />
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        </div>
      )}

      {/* ═══ VIEW 3: PLAN DETAIL (cartons + Mark as Arrived) ═══ */}
      {selectedWarehouseId && activePlan && (
        <PlanDetailView
          plan={activePlan}
          warehouseName={selectedWarehouse?.name}
          expandedCartons={expandedCartons}
          onToggleCarton={toggleCarton}
          onBack={() => setActivePlan(null)}
          onMarkArrived={() => setConfirmPlan(activePlan)}
        />
      )}

      {/* ═══ Confirmation Modal (spec: Mark as Arrived) ═══ */}
      <AnimatePresence>
        {confirmPlan && (
          <ConfirmationModal
            title="Confirm Shipment Arrival"
            message="Are you sure you want to mark this shipment as Arrived? This will enable the merchant to start creating orders from this stock."
            confirmLabel="Confirm Arrival"
            cancelLabel="Cancel"
            variant="info"
            onConfirm={handleConfirmArrival}
            onCancel={() => setConfirmPlan(null)}
            isLoading={markingArrived}
          />
        )}
      </AnimatePresence>

      {/* ═══ Toast ═══ */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.25 }}
            className={`fixed top-20 right-6 z-[70] flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl border backdrop-blur-md ${
              toast.type === "success"
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-300"
                : "bg-red-500/10 border-red-500/20 text-red-300"
            }`}
          >
            {toast.type === "success" ? (
              <CheckCircle size={18} className="shrink-0 text-emerald-500" />
            ) : (
              <AlertCircle size={18} className="shrink-0 text-red-500" />
            )}
            <span className="text-sm font-body font-medium">{toast.message}</span>
            <button onClick={() => setToast(null)} className="ml-1 p-1 rounded-full hover:bg-white/10 transition-colors">
              <X size={14} className="opacity-50" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Plan detail view ──────────────────────────────────────────────────────────

function PlanDetailView({
  plan,
  warehouseName,
  expandedCartons,
  onToggleCarton,
  onBack,
  onMarkArrived,
}: {
  plan: OwnerPlan;
  warehouseName?: string;
  expandedCartons: Set<string>;
  onToggleCarton: (key: string) => void;
  onBack: () => void;
  onMarkArrived: () => void;
}) {
  const arrived = plan.status === "arrived" || plan.status === "completed";
  const cartonContents = (plan.cartons || []).filter((c) => c.items?.length);
  const totalAvailableUnits = (plan.stock || []).reduce((s, e) => s + (e.availableUnits || 0), 0);
  const totalInitialUnits = (plan.stock || []).reduce((s, e) => s + (e.initialUnits || 0), 0);
  const tn = (plan.cartonStats || []).find((s) => s._id === "in-transit")?.count || 0;
  const ar = (plan.cartonStats || []).find((s) => s._id === "arrived")?.count || 0;
  const st = (plan.cartonStats || []).find((s) => s._id === "stored")?.count || 0;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-sm text-neutral-400 hover:text-white font-body transition-colors mb-5"
      >
        <ChevronLeft size={16} /> Back to Inbounds
      </button>

      {/* Header card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="bg-[#111614]/90 backdrop-blur-md rounded-3xl border border-neutral-800/80 shadow-sm p-6 sm:p-7 mb-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-[#84cc16]/10 border border-[#84cc16]/30 flex items-center justify-center shrink-0">
              <Package size={22} className="text-[#84cc16]" />
            </div>
            <div className="min-w-0">
              <h2 className="font-heading text-xl font-semibold text-white truncate">{plan.batchName}</h2>
              <p className="text-xs text-neutral-400 font-body font-mono truncate mt-0.5">Plan ID: {plan._id}</p>
            </div>
          </div>
          <StatusBadge status={plan.status} />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          <div className="p-3 rounded-xl bg-neutral-900/80 border border-neutral-800">
            <div className="flex items-center gap-1.5 mb-1">
              <Hash size={11} className="text-[#84cc16]/70" />
              <p className="text-[9px] font-semibold tracking-wider text-neutral-500 uppercase font-body">Cartons</p>
            </div>
            <p className="text-sm font-bold text-white font-body numeric">{plan.totalCartons}</p>
          </div>
          <div className="p-3 rounded-xl bg-neutral-900/80 border border-neutral-800">
            <div className="flex items-center gap-1.5 mb-1">
              <CalendarDays size={11} className="text-[#84cc16]/70" />
              <p className="text-[9px] font-semibold tracking-wider text-neutral-500 uppercase font-body">Expected</p>
            </div>
            <p className="text-sm font-bold text-white font-body">{formatDate(plan.expectedDate)}</p>
          </div>
          <div className="p-3 rounded-xl bg-neutral-900/80 border border-neutral-800">
            <div className="flex items-center gap-1.5 mb-1">
              <CheckCircle size={11} className="text-[#84cc16]/70" />
              <p className="text-[9px] font-semibold tracking-wider text-neutral-500 uppercase font-body">Received</p>
            </div>
            <p className="text-sm font-bold text-white font-body numeric">{plan.receivedCount ?? 0} / {plan.totalCartons}</p>
          </div>
          <div className="p-3 rounded-xl bg-neutral-900/80 border border-neutral-800">
            <div className="flex items-center gap-1.5 mb-1">
              <Building2 size={11} className="text-[#84cc16]/70" />
              <p className="text-[9px] font-semibold tracking-wider text-neutral-500 uppercase font-body">Warehouse</p>
            </div>
            <p className="text-sm font-bold text-white font-body truncate">{warehouseName || plan.warehouseName || "—"}</p>
          </div>
        </div>

        {plan.merchantName && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-white/5 border border-white/10 mb-5">
            <div className="w-8 h-8 rounded-full bg-[#84cc16] flex items-center justify-center shrink-0">
              <span className="text-[10px] font-semibold text-black font-body">
                {plan.merchantName.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2) || "M"}
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white font-body truncate">{plan.merchantName}</p>
              <p className="text-[11px] text-neutral-400 font-body">Merchant</p>
            </div>
          </div>
        )}

        {/* Mark as Arrived (spec section 2) */}
        {arrived || plan.status === "cancelled" ? (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-3">
            <CheckCircle size={18} className="text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-emerald-300 font-body">Shipment {plan.status === "cancelled" ? "cancelled" : "has arrived"}</p>
              <p className="text-xs text-emerald-400/70 font-body mt-0.5">
                {plan.status === "cancelled"
                  ? "This shipment is no longer active."
                  : "The merchant can now create dispatch orders from this stock."}
              </p>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={onMarkArrived}
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 bg-[#1a231d] text-[#84cc16] border border-[#84cc16]/40 rounded-2xl text-sm font-body font-semibold hover:bg-[#222e26] hover:border-[#84cc16]/60 hover:shadow-lg hover:shadow-[#84cc16]/10 active:scale-[0.99] transition-all duration-200"
          >
            <Truck size={16} /> Mark as Arrived
          </button>
        )}
      </motion.div>

      {/* Carton status summary */}
      {(tn > 0 || ar > 0 || st > 0) && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: "In Transit", value: tn, dot: "bg-amber-400" },
            { label: "Arrived", value: ar, dot: "bg-sky-400" },
            { label: "Stored", value: st, dot: "bg-emerald-400" },
          ].map((k) => (
            <div key={k.label} className="p-4 rounded-2xl bg-[#111614]/90 backdrop-blur-md border border-neutral-800/80 shadow-sm text-center">
              <div className={`w-3 h-3 rounded-full ${k.dot} mx-auto mb-1.5`} />
              <p className="text-lg font-bold text-white font-body numeric">{k.value}</p>
              <p className="text-[10px] text-neutral-400 font-body uppercase tracking-wider">{k.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Stock summary */}
      {totalInitialUnits > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.08 }}
          className="bg-[#111614]/90 backdrop-blur-md rounded-3xl border border-neutral-800/80 shadow-sm p-6 mb-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading text-base font-semibold text-white">Stock Summary</h3>
            <span className="text-[11px] text-neutral-400 font-body">
              {totalAvailableUnits} / {totalInitialUnits} units available
            </span>
          </div>
          <div className="space-y-3">
            {(plan.stock || []).map((s, i) => {
              const pct = s.initialUnits > 0 ? Math.round(((s.availableUnits || 0) / s.initialUnits) * 100) : 0;
              return (
                <div key={`${s.sku || s.itemName}-${i}`} className="p-3.5 rounded-2xl bg-neutral-900/60 border border-neutral-800">
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white font-body truncate">{s.itemName}</p>
                      {s.sku && <p className="text-[10px] text-neutral-500 font-mono">SKU: {s.sku}</p>}
                    </div>
                    <span className="text-[11px] font-semibold text-[#84cc16] font-body whitespace-nowrap">
                      {s.availableUnits || 0} / {s.initialUnits || 0} Available
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-neutral-800 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#84cc16]/50 to-[#84cc16] rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(0, Math.min(100, pct))}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Declared cartons with item breakdown (spec: full list of cartons, item names, quantities) */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.12 }}
        className="bg-[#111614]/90 backdrop-blur-md rounded-3xl border border-neutral-800/80 shadow-sm p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-heading text-base font-semibold text-white">Cartons & Items</h3>
          <span className="text-[11px] text-neutral-400 font-body">{cartonContents.length} carton{cartonContents.length !== 1 ? "s" : ""} declared</span>
        </div>

        {cartonContents.length === 0 ? (
          <div className="text-center py-12">
            <Box size={30} className="mx-auto text-[#84cc16]/30 mb-3" />
            <p className="text-sm text-neutral-400 font-body">No carton contents defined for this plan yet.</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {cartonContents.map((carton) => {
              const isOpen = expandedCartons.has(carton.cartonNumber);
              return (
                <div
                  key={carton.cartonNumber}
                  className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                    isOpen ? "border-[#84cc16]/30 bg-neutral-900/70" : "border-neutral-800 bg-neutral-900/50 hover:border-neutral-700"
                  }`}
                >
                  <button type="button" onClick={() => onToggleCarton(carton.cartonNumber)} className="w-full flex items-center gap-3 px-4 py-3.5 text-left">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${isOpen ? "bg-[#84cc16]/10 border-[#84cc16]/30" : "bg-neutral-800 border-neutral-700"}`}>
                      <Box size={14} className={isOpen ? "text-[#84cc16]" : "text-neutral-400"} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white font-body truncate">{carton.cartonNumber}</p>
                      <p className="text-[11px] text-neutral-500 font-body">
                        {carton.items.length} item{carton.items.length !== 1 ? "s" : ""} · {carton.totalItemsCount} units
                      </p>
                    </div>
                    <CartonBadge status={carton.status} />
                    <ChevronRight size={15} className={`text-neutral-500 transition-transform duration-200 shrink-0 ${isOpen ? "rotate-90 text-[#84cc16]" : ""}`} />
                  </button>
                  <AnimatePresence>
                    {isOpen && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}>
                        <div className="px-4 pb-4">
                          <div className="divide-y divide-neutral-800/80 rounded-xl border border-neutral-800 bg-neutral-950/40 overflow-hidden">
                            {carton.items.map((item, idx) => (
                              <div key={`${item.itemName}-${idx}`} className="flex items-center gap-3 px-3.5 py-2.5">
                                <div className="w-7 h-7 rounded-lg bg-neutral-800/70 flex items-center justify-center shrink-0">
                                  <Layers size={12} className="text-[#84cc16]" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-medium text-white font-body truncate">{item.itemName}</p>
                                  {item.sku && <p className="text-[10px] text-neutral-500 font-mono">SKU: {item.sku}</p>}
                                </div>
                                <span className="text-xs font-bold text-[#84cc16] font-body numeric">× {item.quantity}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
