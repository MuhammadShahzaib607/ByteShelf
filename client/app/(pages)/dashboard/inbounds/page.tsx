"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Building2, Loader2 } from "lucide-react";
import { useAppSelector } from "@/redux/hooks";
import OwnerInboundsTab from "@/components/ui/OwnerInboundsTab";

// ═══════════════════════════════════════════════════════════════════════════════
// PAGE — /dashboard/inbounds
// Thin wrapper: renders the same OwnerInboundsTab used by the dashboard's
// "Inbounds" sidebar tab, inside this standalone deep-link page.
// ═══════════════════════════════════════════════════════════════════════════════

export default function DashboardInboundsPage() {
  const router = useRouter();
  const { user } = useAppSelector((s) => s.auth);

  const isOwner = user?.role === "warehouseOwner";

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0a0d0c] flex items-center justify-center">
        <Loader2 size={28} className="animate-spin text-[#84cc16]" />
      </div>
    );
  }

  if (!isOwner) {
    return (
      <div className="min-h-screen bg-[#0a0d0c] flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center bg-[#111614]/90 backdrop-blur-md rounded-3xl border border-neutral-800/80 p-10">
          <div className="w-16 h-16 rounded-2xl bg-neutral-800/60 flex items-center justify-center mx-auto mb-5">
            <Building2 size={28} className="text-[#84cc16]/40" />
          </div>
          <h1 className="font-heading text-lg font-semibold text-white mb-2">Warehouse Owners Only</h1>
          <p className="text-sm text-neutral-400 font-body mb-6">
            Inbound management is available to warehouse owners. Sign in with an owner account to view incoming shipments.
          </p>
          <button
            onClick={() => router.push("/dashboard")}
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#1a231d] text-[#84cc16] border border-[#84cc16]/40 rounded-full text-sm font-semibold hover:bg-[#222e26] hover:border-[#84cc16]/60 hover:shadow-lg hover:shadow-[#84cc16]/10 transition-all"
          >
            <ArrowLeft size={16} /> Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0d0c] pt-24 pb-20 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <motion.button
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => router.push("/dashboard")}
          className="inline-flex items-center gap-1.5 text-sm text-neutral-400 hover:text-white font-body transition-colors mb-6"
        >
          <ArrowLeft size={16} />
          Back to Dashboard
        </motion.button>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="mb-8">
          <h1 className="font-heading text-2xl sm:text-3xl font-bold text-white tracking-tight">Inbound Shipments</h1>
          <p className="mt-1 text-sm text-neutral-400 font-body">
            Manage incoming cartons and verify deliveries across your warehouses
          </p>
        </motion.div>

        <OwnerInboundsTab />
      </div>
    </div>
  );
}
