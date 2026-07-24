"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  Warehouse,
  MapPin,
  DollarSign,
  Loader2,
  ChevronLeft,
  AlertCircle,
  CheckCircle,
  Save,
} from "lucide-react";
import { useAppSelector } from "@/redux/hooks";
import api from "@/lib/axios";
import MapPicker from "@/components/ui/MapPicker";
import Input from "@/components/ui/Input";

// ─── Types ──────────────────────────────────────────────────────────────────────

interface WarehouseData {
  _id: string;
  name: string;
  location: string;
  latitude: number;
  longitude: number;
  pricePerShelf: number;
  totalShelves: number;
  images: string[];
}

interface FormErrors {
  location?: string;
  pricePerShelf?: string;
}

// ─── Skeleton ───────────────────────────────────────────────────────────────────

function EditSkeleton() {
  return (
    <div className="min-h-screen bg-[#ECFDF5] pt-28 pb-20 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto animate-pulse">
        <div className="h-4 bg-white/50 rounded w-16 mb-6" />
        <div className="bg-white rounded-3xl shadow-xl border border-[#059669]/15 p-8 md:p-10">
          <div className="h-7 bg-[#ECFDF5] rounded-lg w-48 mb-8" />
          <div className="space-y-6">
            <div className="h-5 bg-[#ECFDF5] rounded w-24 mb-2" />
            <div className="h-12 bg-[#ECFDF5] rounded-xl w-full" />
            <div className="h-64 bg-[#ECFDF5] rounded-2xl w-full" />
            <div className="h-12 bg-[#ECFDF5] rounded-full w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PAGE
// ═══════════════════════════════════════════════════════════════════════════════

export default function EditWarehousePage() {
  const router = useRouter();
  const params = useParams();
  const warehouseId = params.warehouseId as string;
  const { accessToken } = useAppSelector((state) => state.auth);

  // ─── Form State ──────────────────────────────────────────────────────────
  const [location, setLocation] = useState("");
  const [pricePerShelf, setPricePerShelf] = useState("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [warehouseName, setWarehouseName] = useState("");
  const [pageLoading, setPageLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [fetchError, setFetchError] = useState(false);

  // ─── Auth guard ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!accessToken) router.replace("/login");
  }, [accessToken, router]);

  // ─── Load existing warehouse ─────────────────────────────────────────────
  useEffect(() => {
    if (!accessToken || !warehouseId) return;

    let cancelled = false;
    const fetchWarehouse = async () => {
      try {
        const res = await api.get(`/warehouse/${warehouseId}`);
        const w: WarehouseData = res.data.data?.warehouse || res.data.data;
        if (!cancelled && w) {
          setWarehouseName(w.name || "");
          setLocation(w.location || "");
          setPricePerShelf(String(w.pricePerShelf || ""));
          setLatitude(w.latitude || null);
          setLongitude(w.longitude || null);
        }
      } catch {
        if (!cancelled) setFetchError(true);
      } finally {
        if (!cancelled) setPageLoading(false);
      }
    };

    fetchWarehouse();
    return () => {
      cancelled = true;
    };
  }, [accessToken, warehouseId]);

  // ─── Validation ──────────────────────────────────────────────────────────
  const validate = (): boolean => {
    const errs: FormErrors = {};
    if (!location.trim()) errs.location = "Location is required";
    if (!pricePerShelf || parseFloat(pricePerShelf) <= 0)
      errs.pricePerShelf = "Price must be greater than 0";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ─── Submit ──────────────────────────────────────────────────────────────
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setApiError(null);
      if (!validate()) return;

      setIsSubmitting(true);
      try {
        await api.put(`/warehouse/edit/${warehouseId}`, {
          location: location.trim(),
          latitude,
          longitude,
          pricePerShelf: parseFloat(pricePerShelf),
        });
        setSuccess(true);
        setTimeout(() => router.push("/warehouses"), 1500);
      } catch (err: any) {
        setApiError(
          err.response?.data?.message || "Failed to update warehouse"
        );
      } finally {
        setIsSubmitting(false);
      }
    },
    [location, latitude, longitude, pricePerShelf, warehouseId, router]
  );

  // ─── Loading ─────────────────────────────────────────────────────────────
  if (pageLoading) {
    return <EditSkeleton />;
  }

  // ─── Fetch Error ─────────────────────────────────────────────────────────
  if (fetchError) {
    return (
      <div className="min-h-screen bg-[#ECFDF5] pt-28 pb-20 px-4 sm:px-6">
        <div className="max-w-2xl mx-auto text-center py-20">
          <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center mx-auto mb-4 shadow-sm">
            <AlertCircle size={28} className="text-red-400" />
          </div>
          <h2 className="font-heading text-xl font-semibold text-[#064E3B] mb-2">
            Warehouse not found
          </h2>
          <p className="text-sm text-[#121212]/50 font-body mb-6">
            The warehouse you are trying to edit does not exist or you don&apos;t
            have permission.
          </p>
          <button
            onClick={() => router.push("/warehouses")}
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#064E3B] text-white rounded-full font-body text-sm font-medium hover:bg-[#059669] transition-all duration-300"
          >
            <ChevronLeft size={16} />
            Back to My Warehouses
          </button>
        </div>
      </div>
    );
  }

  // ─── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#ECFDF5] pt-28 pb-20 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto">
        {/* Back */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-1.5 text-sm text-[#121212]/50 hover:text-[#064E3B] font-body transition-colors mb-6"
          >
            <ChevronLeft size={16} />
            Back
          </button>
        </motion.div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
          className="bg-white rounded-3xl shadow-xl border border-[#059669]/15 p-8 md:p-10"
        >
          {/* Header */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-[#ECFDF5] flex items-center justify-center">
              <Warehouse size={20} className="text-[#059669]" />
            </div>
            <div>
              <h1 className="font-heading text-2xl md:text-3xl font-bold text-[#064E3B] tracking-tight">
                Edit Warehouse
              </h1>
              {warehouseName && (
                <p className="text-sm text-[#121212]/50 font-body mt-0.5">
                  {warehouseName}
                </p>
              )}
            </div>
          </div>

          {/* Success */}
          {success && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center gap-3 mb-6">
              <CheckCircle size={20} className="text-emerald-500 shrink-0" />
              <p className="text-sm text-emerald-700 font-body">
                Warehouse updated successfully! Redirecting...
              </p>
            </div>
          )}

          {/* API Error */}
          {apiError && (
            <div className="p-4 rounded-2xl bg-red-50 border border-red-200 flex items-start gap-3 mb-6">
              <AlertCircle size={18} className="text-red-500 shrink-0 mt-0.5" />
              <p className="text-sm text-red-600 font-body">{apiError}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Location (Address) */}
            <Input
              label="Address / Area"
              placeholder="e.g. 123 Business Ave, Mumbai"
              icon={MapPin}
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              error={errors.location}
            />

            {/* Price Per Shelf */}
            <Input
              label="Price Per Shelf (₹)"
              type="number"
              placeholder="e.g. 1500"
              icon={DollarSign}
              value={pricePerShelf}
              onChange={(e) => setPricePerShelf(e.target.value)}
              error={errors.pricePerShelf}
              min={0}
              step={100}
            />

            {/* Map Picker (pre-filled) */}
            <MapPicker
              latitude={latitude}
              longitude={longitude}
              onChange={(lat, lng) => {
                setLatitude(lat);
                setLongitude(lng);
              }}
            />

            {/* Submit */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full inline-flex items-center justify-center gap-2.5 px-6 py-3.5 bg-[#064E3B] text-white rounded-full font-body font-medium text-sm hover:bg-[#059669] transition-all duration-300 shadow-md hover:shadow-lg active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Saving Changes...
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
