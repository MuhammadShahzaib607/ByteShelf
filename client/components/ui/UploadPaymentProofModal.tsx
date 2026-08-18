"use client";

import { useRef, useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  X,
  Upload,
  ImagePlus,
  Loader2,
  AlertCircle,
  CheckCircle,
  Wallet,
} from "lucide-react";
import api from "@/lib/axios";
import { uploadToCloudinary } from "@/lib/cloudinary";

// ─── Types ──────────────────────────────────────────────────────────────────────

interface UploadPaymentProofModalProps {
  booking: { _id: string; warehouseName?: string; totalAmount?: number };
  onClose: () => void;
  onUploaded: () => void;
}

// ─── Component (dark theme) ─────────────────────────────────────────────────────

export default function UploadPaymentProofModal({
  booking,
  onClose,
  onUploaded,
}: UploadPaymentProofModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setError(null);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!file) {
      setError("Please select a payment proof screenshot first.");
      return;
    }
    setUploading(true);
    setError(null);
    try {
      const result = await uploadToCloudinary(file);
      await api.patch(`/booking/${booking._id}/upload-proof`, {
        paymentProofUrl: result.secure_url,
      });
      setSuccess(true);
      setTimeout(() => {
        onClose();
        onUploaded();
      }, 1500);
    } catch (err: unknown) {
      const axiosErr = err as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      setError(
        axiosErr.response?.data?.message ||
          axiosErr.message ||
          "Failed to upload payment proof."
      );
    } finally {
      setUploading(false);
    }
  }, [file, booking._id, onClose, onUploaded]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-start justify-center p-4 pt-16 sm:pt-20 bg-black/70 backdrop-blur-sm overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget && !uploading) onClose();
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="w-full max-w-lg bg-slate-900 rounded-3xl shadow-2xl border border-slate-800 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {success ? (
          <div className="p-8 text-center">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={28} className="text-emerald-400" />
            </div>
            <h2 className="font-heading text-xl font-bold text-white mb-2">
              Payment Proof Submitted!
            </h2>
            <p className="text-sm text-slate-300 font-body mb-5">
              Your payment screenshot is now pending verification by the warehouse
              owner. You&apos;ll be notified once it&apos;s confirmed.
            </p>
          </div>
        ) : (
          <div className="p-6 sm:p-8">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
                <Wallet size={20} className="text-emerald-400" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="font-heading text-lg font-semibold text-white">
                  Upload Payment Proof
                </h2>
                <p className="text-xs text-slate-400 font-body truncate">
                  {booking.warehouseName || "Booking"} · Rs.{" "}
                  {(booking.totalAmount || 0).toLocaleString("en-PK")}
                </p>
              </div>
              <button
                onClick={onClose}
                disabled={uploading}
                className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 hover:bg-slate-700 hover:text-white transition-all disabled:opacity-50 shrink-0"
              >
                <X size={16} />
              </button>
            </div>

            <p className="text-sm text-slate-300 font-body leading-relaxed mb-5">
              Upload a screenshot of your bank transfer or mobile wallet payment
              receipt. The warehouse owner will verify it before your booking is
              confirmed.
            </p>

            {/* File picker / preview */}
            <div
              onClick={() => !uploading && fileInputRef.current?.click()}
              className={`relative rounded-2xl border-2 border-dashed transition-all duration-200 overflow-hidden ${
                preview
                  ? "border-emerald-500/40"
                  : "border-slate-700 hover:border-emerald-500/40 cursor-pointer"
              }`}
            >
              {preview ? (
                <>
                  <img
                    src={preview}
                    alt="Payment proof preview"
                    className="w-full h-56 object-contain bg-slate-800/60 p-2"
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFile(null);
                      setPreview(null);
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                    disabled={uploading}
                    className="absolute top-3 right-3 w-7 h-7 rounded-full bg-black/60 border border-white/20 text-white flex items-center justify-center hover:bg-black/80 transition-colors"
                    aria-label="Remove screenshot"
                  >
                    <X size={14} />
                  </button>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <ImagePlus size={32} className="text-slate-500 mb-3" />
                  <p className="text-sm text-slate-300 font-body font-medium">
                    Click to select a screenshot
                  </p>
                  <p className="text-xs text-slate-500 font-body mt-1">
                    JPEG, PNG, WebP or PDF · max 5MB
                  </p>
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif,application/pdf"
              className="hidden"
              onChange={handleFileSelect}
            />

            {error && (
              <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-2.5">
                <AlertCircle size={14} className="text-red-400 shrink-0 mt-0.5" />
                <p className="text-xs text-red-300 font-body">{error}</p>
              </div>
            )}

            <div className="mt-6 flex items-center gap-3">
              <button
                onClick={onClose}
                disabled={uploading}
                className="flex-1 px-5 py-3 border-2 border-slate-700 text-slate-300 rounded-full font-body text-sm font-medium hover:bg-slate-800 hover:border-slate-600 transition-all duration-200 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={uploading || !file}
                className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 bg-emerald-500 text-white rounded-full font-body text-sm font-medium hover:bg-emerald-600 transition-all duration-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload size={16} />
                    Submit for Verification
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
