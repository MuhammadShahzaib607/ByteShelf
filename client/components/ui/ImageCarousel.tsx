"use client";

import { useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Warehouse } from "lucide-react";
import BlurredImage from "./BlurredImage";

// ─── Types ──────────────────────────────────────────────────────────────────────

interface ImageCarouselProps {
  images: string[];
  alt: string;
  className?: string;
  aspectRatio?: string;
}

// ─── Animation variants ─────────────────────────────────────────────────────────

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 300 : -300,
    opacity: 0,
  }),
};

// ═══════════════════════════════════════════════════════════════════════════════
// IMAGE CAROUSEL
// ═══════════════════════════════════════════════════════════════════════════════

const ImageCarousel: React.FC<ImageCarouselProps> = ({
  images,
  alt,
  className = "",
  aspectRatio = "h-44",
}) => {
  const [[imgIndex, direction], setImgState] = useState([0, 0]);
  const validImages = images?.filter(Boolean) || [];
  const hasImages = validImages.length > 0;

  const prev = useCallback(
    (e?: React.MouseEvent) => {
      e?.stopPropagation();
      setImgState(([i]) => [
        (i - 1 + validImages.length) % validImages.length,
        -1,
      ]);
    },
    [validImages.length]
  );

  const next = useCallback(
    (e?: React.MouseEvent) => {
      e?.stopPropagation();
      setImgState(([i]) => [(i + 1) % validImages.length, 1]);
    },
    [validImages.length]
  );

  // Fallback — no images
  if (!hasImages) {
    return (
      <div
        className={`relative ${aspectRatio} overflow-hidden bg-gradient-to-br from-[#F8FAFC] to-[#F1F5F9] ${className}`}
      >
        <div className="absolute inset-0 flex flex-col items-center justify-center text-[#0284C7]/20">
          <Warehouse size={40} strokeWidth={1} />
        </div>
      </div>
    );
  }

  // Single image — dual-layer blur container
  if (validImages.length === 1) {
    return (
      <BlurredImage
        src={validImages[0]}
        alt={alt}
        aspectRatio={aspectRatio}
        containerClass={className}
      />
    );
  }

  // Multi-image carousel with dual-layer blur
  return (
    <div
      className={`relative overflow-hidden bg-slate-900/10 rounded-2xl group ${className}`}
    >
      <div className={`relative ${aspectRatio}`}>
        {/* Background Layer — ambient blurred fill */}
        <img
          src={validImages[imgIndex]}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover blur-xl scale-110 opacity-60"
        />
        <div className="absolute inset-0 bg-slate-900/10" />

        {/* Foreground Layer — animated carousel */}
        <AnimatePresence initial={false} custom={direction}>
          <motion.img
            key={imgIndex}
            src={validImages[imgIndex]}
            alt={`${alt} — image ${imgIndex + 1}`}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="absolute inset-0 w-full h-full object-cover z-10"
          />
        </AnimatePresence>

        {/* Gradient overlays for button visibility */}
        <div className="absolute inset-y-0 left-0 w-14 bg-gradient-to-r from-black/15 to-transparent pointer-events-none z-20" />
        <div className="absolute inset-y-0 right-0 w-14 bg-gradient-to-l from-black/15 to-transparent pointer-events-none z-20" />

        {/* Prev / Next — glassmorphic buttons */}
        <button
          onClick={prev}
          className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/70 backdrop-blur-md flex items-center justify-center text-[#1E293B] shadow-lg shadow-black/10 hover:bg-white hover:scale-105 active:scale-95 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 z-30 border border-white/20"
          aria-label="Previous image"
        >
          <ChevronLeft size={17} />
        </button>
        <button
          onClick={next}
          className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/70 backdrop-blur-md flex items-center justify-center text-[#1E293B] shadow-lg shadow-black/10 hover:bg-white hover:scale-105 active:scale-95 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 z-30 border border-white/20"
          aria-label="Next image"
        >
          <ChevronRight size={17} />
        </button>

        {/* Indicator dots */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-30">
          {validImages.map((_, i) => (
            <span
              key={i}
              className={`rounded-full transition-all duration-300 ${
                i === imgIndex
                  ? "w-5 h-1.5 bg-white shadow-md"
                  : "w-1.5 h-1.5 bg-white/50"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default ImageCarousel;
