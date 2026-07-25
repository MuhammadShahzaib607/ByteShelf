"use client";

import { useState } from "react";

// ─── Types ──────────────────────────────────────────────────────────────────────

interface BlurredImageProps {
  src: string;
  alt: string;
  className?: string;
  aspectRatio?: string;
  /** If true, wraps with a rounded container; default true */
  container?: boolean;
  containerClass?: string;
  /** Quality of the foreground image sizing: "cover" (default) or "contain" */
  fit?: "cover" | "contain";
}

// ═══════════════════════════════════════════════════════════════════════════════
// DUAL-LAYER BLURRED IMAGE CONTAINER
// ═══════════════════════════════════════════════════════════════════════════════
//
// Background Layer:  absolute inset-0, object-cover, blur-xl scale-110 opacity-60
//   Creates a soft, ambient blurred background fill.
// Foreground Layer:  relative z-10, object-cover, w-full h-full
//   The original photo rendered clearly without cropping/distortion.
// Container:         rounded-2xl/rounded-3xl overflow-hidden relative
//   with a subtle dark background fallback (bg-slate-900/10).

const BlurredImage: React.FC<BlurredImageProps> = ({
  src,
  alt,
  className = "",
  aspectRatio = "h-44",
  container = true,
  containerClass = "",
  fit = "cover",
}) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  if (error || !src) {
    return (
      <div
        className={`relative ${aspectRatio} overflow-hidden bg-gradient-to-br from-[#F8FAFC] to-[#F1F5F9] ${className} ${containerClass}`}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-8 rounded-lg bg-[#E2E8F0] flex items-center justify-center">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#94A3B8"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
          </div>
        </div>
      </div>
    );
  }

  const content = (
    <div
      className={`relative ${aspectRatio} overflow-hidden ${className} ${containerClass}`}
    >
      {/* Background Layer — ambient blurred fill */}
      <img
        src={src}
        alt=""
        aria-hidden="true"
        className={`absolute inset-0 w-full h-full object-cover blur-xl scale-110 transition-opacity duration-500 ${
          loaded ? "opacity-60" : "opacity-0"
        }`}
      />

      {/* Subtle dark overlay on background for depth */}
      <div
        className={`absolute inset-0 bg-slate-900/10 dark:bg-slate-900/40 transition-opacity duration-500 ${
          loaded ? "opacity-100" : "opacity-0"
        }`}
      />

      {/* Foreground Layer — sharp, clear image */}
      <img
        src={src}
        alt={alt}
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
        className={`relative z-10 w-full h-full transition-all duration-500 ${
          fit === "contain" ? "object-contain p-4" : "object-cover"
        } ${loaded ? "opacity-100" : "opacity-0"}`}
      />

      {/* Loading shimmer */}
      {!loaded && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
      )}
    </div>
  );

  if (!container) return content;

  return (
    <div
      className={`relative overflow-hidden bg-slate-900/10 dark:bg-slate-900/40 rounded-2xl ${containerClass}`}
    >
      {content}
    </div>
  );
};

export default BlurredImage;
