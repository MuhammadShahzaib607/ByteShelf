"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Warehouse,
  MapPin,
  DollarSign,
  Image as ImageIcon,
  Loader2,
  X,
  Plus,
  ChevronLeft,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { useAppSelector } from "@/redux/hooks";
import api from "@/lib/axios";
import { uploadToCloudinary } from "@/lib/cloudinary";
import MapPicker from "@/components/ui/MapPicker";
import Input from "@/components/ui/Input";

// ─── Types ──────────────────────────────────────────────────────────────────────

interface FormErrors {
  name?: string;
  location?: string;
  pricePerShelf?: string;
  coordinates?: string;
  images?: string;
}

// ─── Image Preview Item ─────────────────────────────────────────────────────────

function ImagePreview({
  src,
  onRemove,
  isUploading,
}: {
  src: string;
  onRemove: () => void;
  isUploading?: boolean;
}) {
  return (
    <div className="relative group w-24 h-24 md:w-28 md:h-28 rounded-xl overflow-hidden border border-[#0284C7]/15 bg-[#F8FAFC]/40 shrink-0">
      <img
        src={src}
        alt="Preview"
        className="w-full h-full object-cover"
      />
      {isUploading && (
        <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
          <Loader2 size={18} className="animate-spin text-white" />
        </div>
      )}
      <button
        type="button"
        onClick={onRemove}
        className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100"
        aria-label="Remove image"
      >
        <X size={10} className="text-white" />
      </button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PAGE
// ═══════════════════════════════════════════════════════════════════════════════

export default function AddWarehousePage() {
  const router = useRouter();
  const { accessToken, user, isCheckingAuth } = useAppSelector(
    (state) => state.auth
  );

  // ─── Form State ──────────────────────────────────────────────────────────
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [pricePerShelf, setPricePerShelf] = useState("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ─── Auth guard ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (isCheckingAuth) return;
    if (!accessToken) {
      router.replace("/login");
      return;
    }
    if (user?.role !== "warehouseOwner") {
      router.replace("/explore");
    }
  }, [accessToken, user, isCheckingAuth, router]);

  // ─── File handler ────────────────────────────────────────────────────────
  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      const remaining = 5 - imageFiles.length;
      const toAdd = files.slice(0, remaining);

      setImageFiles((prev) => [...prev, ...toAdd]);
      setImagePreviews((prev) => [
        ...prev,
        ...toAdd.map((f) => URL.createObjectURL(f)),
      ]);
    },
    [imageFiles.length]
  );

  const removeImage = useCallback((index: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  // ─── Validation ──────────────────────────────────────────────────────────
  const validate = (): boolean => {
    const errs: FormErrors = {};
    if (!name.trim()) errs.name = "Warehouse name is required";
    if (!location.trim()) errs.location = "Location is required";
    if (!pricePerShelf || parseFloat(pricePerShelf) <= 0)
      errs.pricePerShelf = "Price must be greater than 0";
    if (latitude === null || longitude === null)
      errs.coordinates = "Please select a location on the map";
    if (uploadedUrls.length === 0 && imageFiles.length === 0)
      errs.images = "Please upload at least one image";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ─── Submit ──────────────────────────────────────────────────────────────
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setApiError(null);
      setErrors({});

      // Upload images first
      let finalUrls = [...uploadedUrls];
      if (imageFiles.length > 0) {
        setUploadingImage(true);
        try {
          for (const file of imageFiles) {
            const result = await uploadToCloudinary(file);
            finalUrls.push(result.secure_url);
          }
          setUploadedUrls(finalUrls);
          setImageFiles([]);
          setImagePreviews([]);
        } catch (err: any) {
          setApiError(err.message || "Failed to upload images");
          setUploadingImage(false);
          return;
        }
        setUploadingImage(false);
      }

      if (!validate()) return;

      setIsSubmitting(true);
      try {
        await api.post("/warehouse/create", {
          name: name.trim(),
          location: location.trim(),
          latitude,
          longitude,
          pricePerShelf: parseFloat(pricePerShelf),
          images: finalUrls,
        });
        setSuccess(true);
        router.push("/warehouses");
      } catch (err: any) {
        setApiError(
          err.response?.data?.message || "Failed to create warehouse"
        );
      } finally {
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
      uploadedUrls,
      router,
    ]
  );

  // ─── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#F8FAFC] pt-28 pb-20 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto">
        {/* Back */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-1.5 text-sm text-[#0F172A]/50 hover:text-[#1E293B] font-body transition-colors mb-6"
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
          className="bg-white rounded-3xl shadow-xl border border-[#0284C7]/15 p-8 md:p-10"
        >
          {/* Header */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-[#F8FAFC] flex items-center justify-center">
              <Warehouse size={20} className="text-[#0284C7]" />
            </div>
            <h1 className="font-heading text-2xl md:text-3xl font-bold text-[#1E293B] tracking-tight">
              Add Warehouse
            </h1>
          </div>

          {/* Success */}
          {success && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center gap-3 mb-6">
              <CheckCircle size={20} className="text-emerald-500 shrink-0" />
              <p className="text-sm text-emerald-700 font-body">
                Warehouse created successfully! Redirecting...
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
            {/* Name */}
            <Input
              label="Warehouse Name"
              placeholder="e.g. Downtown Storage Hub"
              icon={Warehouse}
              value={name}
              onChange={(e) => setName(e.target.value)}
              error={errors.name}
            />

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
              label="Price Per Shelf (Rs.)"
              type="number"
              placeholder="e.g. 1500"
              icon={DollarSign}
              value={pricePerShelf}
              onChange={(e) => setPricePerShelf(e.target.value)}
              error={errors.pricePerShelf}
              min={0}
              step={100}
            />

            {/* Map Picker */}
            <MapPicker
              latitude={latitude}
              longitude={longitude}
              onChange={(lat, lng) => {
                setLatitude(lat);
                setLongitude(lng);
              }}
            />
            {errors.coordinates && (
              <p className="text-red-500 text-xs mt-1 ml-1 font-body">
                {errors.coordinates}
              </p>
            )}

            {/* Image Upload */}
            <div>
              <label className="text-xs font-semibold tracking-wider text-[#1E293B] uppercase mb-3 block font-body">
                Images (Max 5)
              </label>

              {/* Previews */}
              {imagePreviews.length > 0 && (
                <div className="flex flex-wrap gap-3 mb-4">
                  {imagePreviews.map((src, i) => (
                    <ImagePreview
                      key={i}
                      src={src}
                      onRemove={() => removeImage(i)}
                    />
                  ))}
                </div>
              )}

              {/* Uploaded URLs (from previous uploads) */}
              {uploadedUrls.length > 0 && (
                <div className="flex flex-wrap gap-3 mb-4">
                  {uploadedUrls.map((url, i) => (
                    <ImagePreview
                      key={`uploaded-${i}`}
                      src={url}
                      onRemove={() =>
                        setUploadedUrls((prev) =>
                          prev.filter((_, idx) => idx !== i)
                        )
                      }
                    />
                  ))}
                </div>
              )}

              {/* Upload Button */}
              {imageFiles.length + uploadedUrls.length < 5 && (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="w-24 h-24 md:w-28 md:h-28 rounded-xl border-2 border-dashed border-[#0284C7]/30 hover:border-[#0284C7]/60 bg-[#F8FAFC]/20 flex flex-col items-center justify-center gap-1 cursor-pointer transition-all hover:bg-[#F8FAFC]/40 shrink-0"
                >
                  <Plus size={20} className="text-[#0284C7]/50" />
                  <span className="text-[10px] text-[#0284C7]/50 font-body">
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
              {errors.images && (
                <p className="text-red-500 text-xs mt-2 font-body">
                  {errors.images}
                </p>
              )}
            </div>

            {/* Submit */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={isSubmitting || uploadingImage}
                className="w-full inline-flex items-center justify-center gap-2.5 px-6 py-3.5 bg-[#1E293B] text-white rounded-full font-body font-medium text-sm hover:bg-[#0284C7] transition-all duration-300 shadow-md shadow-slate-900/10 hover:shadow-lg active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {uploadingImage ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Uploading Images...
                  </>
                ) : isSubmitting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Creating Warehouse...
                  </>
                ) : (
                  <>
                    <Plus size={18} />
                    Create Warehouse
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
