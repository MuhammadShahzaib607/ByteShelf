"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import {
  Warehouse,
  MapPin,
  DollarSign,
  Loader2,
  X,
  Plus,
  Save,
  AlertCircle,
  Layers,
} from "lucide-react";
import { useAppSelector } from "@/redux/hooks";
import api from "@/lib/axios";
import { uploadToCloudinary } from "@/lib/cloudinary";
import MapPicker from "@/components/ui/MapPicker";
import PayoutDetailsForm, { emptyPayoutDetails, type PayoutDetailsData } from "@/components/ui/PayoutDetailsForm";

// ─── Types ──────────────────────────────────────────────────────────────────────

interface EditWarehouseModalProps {
  warehouseId: string;
  warehouseName: string;
  onClose: () => void;
  onSaved: () => void;
}

interface FormErrors {
  name?: string;
  location?: string;
  pricePerShelf?: string;
  coordinates?: string;
}

// ─── Image Preview Item (dark) ─────────────────────────────────────────────────

function DarkImagePreview({
  src,
  onRemove,
  isUploading,
}: {
  src: string;
  onRemove: () => void;
  isUploading?: boolean;
}) {
  return (
    <div className="relative group w-24 h-24 md:w-28 md:h-28 rounded-xl overflow-hidden bg-white/5 border border-neutral-800 shrink-0">
      {/* Blurred Background Layer */}
      <img
        src={src}
        alt=""
        className="absolute inset-0 w-full h-full object-cover blur-2xl opacity-60 scale-110"
      />
      {/* Sharp Foreground Layer */}
      <img
        src={src}
        alt="Preview"
        className="relative z-10 w-full h-full object-contain drop-shadow-2xl"
      />
      {isUploading && (
        <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
          <Loader2 size={18} className="animate-spin text-white" />
        </div>
      )}
      {/* Delete / Remove 'X' — stays above the image (z-30), click-safe */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className="pointer-events-auto absolute top-1 right-1 z-30 w-6 h-6 rounded-full bg-neutral-900 border border-neutral-700 text-white hover:border-red-500 hover:bg-red-500/20 hover:text-red-400 flex items-center justify-center transition-all cursor-pointer shadow-lg opacity-0 group-hover:opacity-100"
        aria-label="Remove image"
      >
        <X size={11} className="text-current" />
      </button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// EDIT WAREHOUSE MODAL (Dark Glassmorphic)
// ═══════════════════════════════════════════════════════════════════════════════

export default function EditWarehouseModal({
  warehouseId,
  warehouseName,
  onClose,
  onSaved,
}: EditWarehouseModalProps) {
  const { accessToken } = useAppSelector((state) => state.auth);

  // ─── Form State ──────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);

  const [name, setName] = useState(warehouseName || "");
  const [location, setLocation] = useState("");
  const [pricePerShelf, setPricePerShelf] = useState("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [shelfCount, setShelfCount] = useState(0);
  const [payout, setPayout] = useState<PayoutDetailsData>(emptyPayoutDetails);

  // ─── Images ──────────────────────────────────────────────────────────────
  const [existingUrls, setExistingUrls] = useState<string[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [apiError, setApiError] = useState<string | null>(null);

  // ─── Load existing warehouse (pre-fill every field) ─────────────────────
  useEffect(() => {
    if (!accessToken || !warehouseId) return;

    let cancelled = false;
    const fetchWarehouse = async () => {
      try {
        const res = await api.get(`/warehouse/${warehouseId}`);
        const data = res.data.data;
        const w = data?.warehouse || data;
        if (!cancelled && w) {
          setName(w.name || "");
          setLocation(w.location || "");
          setPricePerShelf(String(w.pricePerShelf ?? ""));
          setLatitude(w.latitude ?? null);
          setLongitude(w.longitude ?? null);
          setShelfCount(w.totalShelves ?? 0);
          setExistingUrls(Array.isArray(w.images) ? w.images : []);
          if (w.payoutDetails && typeof w.payoutDetails === "object") {
            const p = w.payoutDetails;
            setPayout({
              payoutType:
                (["bank_account", "mobile_wallet", "both"] as const).includes(
                  p.payoutType
                )
                  ? p.payoutType
                  : "bank_account",
              bankDetails: {
                accountTitle: p.bankDetails?.accountTitle || "",
                bankName: p.bankDetails?.bankName || "",
                accountNumber: p.bankDetails?.accountNumber || "",
                iban: p.bankDetails?.iban || "",
              },
              walletDetails: {
                easyPaisaNumber: p.walletDetails?.easyPaisaNumber || "",
                easyPaisaTitle: p.walletDetails?.easyPaisaTitle || "",
                jazzCashNumber: p.walletDetails?.jazzCashNumber || "",
                jazzCashTitle: p.walletDetails?.jazzCashTitle || "",
                sadaPayTagOrNumber: p.walletDetails?.sadaPayTagOrNumber || "",
                nayaPayTagOrNumber: p.walletDetails?.nayaPayTagOrNumber || "",
              },
            });
          }
        }
      } catch {
        if (!cancelled) setFetchError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchWarehouse();
    return () => {
      cancelled = true;
    };
  }, [accessToken, warehouseId]);

  // ─── File handling ───────────────────────────────────────────────────────
  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      const remaining = 5 - (existingUrls.length + imageFiles.length);
      const toAdd = files.slice(0, remaining);

      setImageFiles((prev) => [...prev, ...toAdd]);
      setImagePreviews((prev) => [
        ...prev,
        ...toAdd.map((f) => URL.createObjectURL(f)),
      ]);
    },
    [existingUrls.length, imageFiles.length]
  );

  // ─── Remove image (from uploaded URLs or new local previews) ─────────────
  const handleRemoveImage = useCallback(
    (type: "existing" | "new", index: number) => {
      if (type === "existing") {
        setExistingUrls((prev) => prev.filter((_, i) => i !== index));
      } else {
        setImageFiles((prev) => prev.filter((_, i) => i !== index));
        setImagePreviews((prev) => {
          URL.revokeObjectURL(prev[index]);
          return prev.filter((_, i) => i !== index);
        });
      }
    },
    []
  );

  // ─── Validation ──────────────────────────────────────────────────────────
  const validate = useCallback((): boolean => {
    const errs: FormErrors = {};
    if (!name.trim()) errs.name = "Warehouse name is required";
    if (!location.trim()) errs.location = "Location is required";
    if (!pricePerShelf || parseFloat(pricePerShelf) <= 0)
      errs.pricePerShelf = "Price must be greater than 0";
    if (latitude === null || longitude === null)
      errs.coordinates = "Please select a location on the map";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }, [name, location, pricePerShelf, latitude, longitude]);

  // ─── Submit ──────────────────────────────────────────────────────────────
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setApiError(null);
      setErrors({});
      if (!validate()) return;

      // Upload new images first
      const finalUrls = [...existingUrls];
      if (imageFiles.length > 0) {
        setUploadingImage(true);
        try {
          for (const file of imageFiles) {
            const result = await uploadToCloudinary(file);
            finalUrls.push(result.secure_url);
          }
        } catch (err: unknown) {
          setApiError(
            err instanceof Error ? err.message : "Failed to upload images"
          );
          setUploadingImage(false);
          return;
        }
        setUploadingImage(false);
      }

      setIsSubmitting(true);
      try {
        await api.put(`/warehouse/edit/${warehouseId}`, {
          name: name.trim(),
          location: location.trim(),
          latitude,
          longitude,
          pricePerShelf: parseFloat(pricePerShelf),
          images: finalUrls,
          payoutDetails: payout,
        });
        onSaved();
      } catch (err: unknown) {
        const axiosErr = err as {
          response?: { data?: { message?: string } };
        };
        setApiError(
          axiosErr.response?.data?.message || "Failed to update warehouse"
        );
        setIsSubmitting(false);
      }
    },
    [
      name,
      location,
      latitude,
      longitude,
      pricePerShelf,
      imageFiles,
      existingUrls,
      payout,
      warehouseId,
      onSaved,
      validate,
    ]
  );

  const totalImages = existingUrls.length + imageFiles.length;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[60] flex items-start justify-center p-4 pt-16 sm:pt-20 bg-black/70 backdrop-blur-sm overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose();
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="w-full max-w-2xl bg-[#111614]/95 backdrop-blur-xl border border-neutral-800 text-white rounded-3xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          disabled={isSubmitting}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/10 border border-neutral-800 flex items-center justify-center text-neutral-400 hover:bg-white/20 hover:text-white transition-all duration-200 z-10 disabled:opacity-50"
        >
          <X size={16} />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 px-6 sm:px-8 pt-6 pb-4 border-b border-neutral-800/80">
          <div className="w-10 h-10 rounded-xl bg-[#84cc16]/10 border border-[#84cc16]/20 flex items-center justify-center shrink-0">
            <Warehouse size={20} className="text-[#84cc16]" />
          </div>
          <div className="min-w-0">
            <h2 className="font-heading text-xl font-bold text-white tracking-tight">
              Edit Warehouse
            </h2>
            <p className="text-sm text-neutral-400 font-body truncate">
              {warehouseName}
            </p>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 sm:px-8 py-6 max-h-[calc(100vh-220px)] overflow-y-auto">
          {loading ? (
            <div className="space-y-5 animate-pulse">
              <div className="h-12 bg-neutral-800/60 rounded-xl w-full" />
              <div className="h-12 bg-neutral-800/60 rounded-xl w-full" />
              <div className="h-12 bg-neutral-800/60 rounded-xl w-full" />
              <div className="h-64 bg-neutral-800/60 rounded-2xl w-full" />
            </div>
          ) : fetchError ? (
            <div className="text-center py-14">
              <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
                <AlertCircle size={26} className="text-red-400" />
              </div>
              <h3 className="font-heading text-lg font-semibold text-white mb-1">
                Couldn&apos;t load warehouse
              </h3>
              <p className="text-sm text-neutral-400 font-body mb-6">
                Please close and try again.
              </p>
              <button
                onClick={onClose}
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#1a231d] text-[#84cc16] border border-[#84cc16]/40 rounded-full font-body text-sm font-semibold hover:bg-[#222e26] hover:border-[#84cc16]/60 transition-all"
              >
                Close
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Warehouse Name */}
              <div>
                <label className="text-xs font-semibold tracking-wider text-neutral-400 uppercase mb-2 block font-body">
                  Warehouse Name
                </label>
                <div className="relative">
                  <Warehouse size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#84cc16]/70 pointer-events-none" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Downtown Storage Hub"
                    className="w-full pl-11 pr-4 py-3.5 bg-neutral-800/80 border border-neutral-700 text-white placeholder-neutral-500 focus:border-[#84cc16] focus:outline-none focus:ring-1 focus:ring-[#84cc16]/30 rounded-xl transition-all text-sm font-body"
                  />
                </div>
                {errors.name && (
                  <p className="text-red-400 text-xs mt-1.5 ml-1 font-body">
                    {errors.name}
                  </p>
                )}
              </div>

              {/* Location */}
              <div>
                <label className="text-xs font-semibold tracking-wider text-neutral-400 uppercase mb-2 block font-body">
                  Address / Area
                </label>
                <div className="relative">
                  <MapPin size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#84cc16]/70 pointer-events-none" />
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Gulistan-e-Johar, Karachi"
                    className="w-full pl-11 pr-4 py-3.5 bg-neutral-800/80 border border-neutral-700 text-white placeholder-neutral-500 focus:border-[#84cc16] focus:outline-none focus:ring-1 focus:ring-[#84cc16]/30 rounded-xl transition-all text-sm font-body"
                  />
                </div>
                {errors.location && (
                  <p className="text-red-400 text-xs mt-1.5 ml-1 font-body">
                    {errors.location}
                  </p>
                )}
              </div>

              {/* Price + Shelf Count */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold tracking-wider text-neutral-400 uppercase mb-2 block font-body">
                    Price Per Shelf (Rs.)
                  </label>
                  <div className="relative">
                    <DollarSign size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#84cc16]/70 pointer-events-none" />
                    <input
                      type="number"
                      value={pricePerShelf}
                      onChange={(e) => setPricePerShelf(e.target.value)}
                      placeholder="e.g. 1500"
                      min={0}
                      step={100}
                      className="w-full pl-11 pr-4 py-3.5 bg-neutral-800/80 border border-neutral-700 text-white placeholder-neutral-500 focus:border-[#84cc16] focus:outline-none focus:ring-1 focus:ring-[#84cc16]/30 rounded-xl transition-all text-sm font-body [color-scheme:dark]"
                    />
                  </div>
                  {errors.pricePerShelf && (
                    <p className="text-red-400 text-xs mt-1.5 ml-1 font-body">
                      {errors.pricePerShelf}
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-xs font-semibold tracking-wider text-neutral-400 uppercase mb-2 block font-body">
                    Shelf Count
                  </label>
                  <div className="flex items-center gap-2.5 px-4 py-3.5 bg-neutral-800/40 border border-neutral-700/60 rounded-xl text-sm font-body">
                    <Layers size={16} className="text-[#84cc16]/70 shrink-0" />
                    <span className="text-white font-semibold numeric">
                      {shelfCount}
                    </span>
                    <span className="text-neutral-500 text-xs">
                      shelf{shelfCount !== 1 ? "ves" : ""} total
                    </span>
                  </div>
                </div>
              </div>

              {/* Map Picker (pre-filled) */}
              <MapPicker
                dark
                latitude={latitude}
                longitude={longitude}
                onChange={(lat, lng) => {
                  setLatitude(lat);
                  setLongitude(lng);
                }}
              />
              {errors.coordinates && (
                <p className="text-red-400 text-xs mt-1 ml-1 font-body">
                  {errors.coordinates}
                </p>
              )}

              {/* Images */}
              <div>
                <label className="text-xs font-semibold tracking-wider text-neutral-400 uppercase mb-3 block font-body">
                  Images (Max 5)
                </label>

                {(existingUrls.length > 0 || imagePreviews.length > 0) && (
                  <div className="flex flex-wrap gap-3 mb-4">
                    {existingUrls.map((url, i) => (
                      <DarkImagePreview
                        key={`existing-${i}`}
                        src={url}
                        onRemove={() => handleRemoveImage("existing", i)}
                      />
                    ))}
                    {imagePreviews.map((src, i) => (
                      <DarkImagePreview
                        key={`new-${i}`}
                        src={src}
                        onRemove={() => handleRemoveImage("new", i)}
                      />
                    ))}
                  </div>
                )}

                {totalImages < 5 && (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="w-24 h-24 md:w-28 md:h-28 rounded-xl border-2 border-dashed border-neutral-700 hover:border-[#84cc16]/40 bg-white/[0.02] hover:bg-white/[0.04] flex flex-col items-center justify-center gap-1 cursor-pointer transition-all shrink-0"
                  >
                    <Plus size={20} className="text-neutral-500" />
                    <span className="text-[10px] text-neutral-500 font-body">
                      Add Image
                    </span>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/avif"
                  multiple
                  className="hidden"
                  onChange={handleFileSelect}
                />
              </div>

              {/* Payout & Bank Details */}
              <PayoutDetailsForm value={payout} onChange={setPayout} />

              {/* API Error */}
              {apiError && (
                <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-start gap-3">
                  <AlertCircle size={18} className="text-red-400 shrink-0 mt-0.5" />
                  <p className="text-sm text-red-300 font-body">{apiError}</p>
                </div>
              )}

              {/* Submit */}
              <div className="pt-2 pb-1">
                <button
                  type="submit"
                  disabled={isSubmitting || uploadingImage}
                  className="w-full inline-flex items-center justify-center gap-2.5 px-6 py-3.5 bg-[#1a231d] text-[#84cc16] border border-[#84cc16]/40 rounded-full font-body font-semibold text-sm hover:bg-[#222e26] hover:border-[#84cc16]/60 hover:shadow-lg hover:shadow-[#84cc16]/10 active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploadingImage ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Uploading Images...
                    </>
                  ) : isSubmitting ? (
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
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
