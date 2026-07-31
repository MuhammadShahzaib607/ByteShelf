"use client";

import { useCallback, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, ImageOff } from "lucide-react";

interface BlogCarouselProps {
  images: string[];
  alt: string;
  className?: string;
}

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 320 : -320,
    opacity: 0,
    scale: 0.98,
  }),
  center: {
    x: 0,
    opacity: 1,
    scale: 1,
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 320 : -320,
    opacity: 0,
    scale: 0.98,
  }),
};

const BlogCarousel: React.FC<BlogCarouselProps> = ({
  images,
  alt,
  className = "",
}) => {
  const validImages = images?.filter(Boolean) || [];
  const [[index, direction], setState] = useState([0, 0]);
  const count = validImages.length;
  const hasImages = count > 0;

  const paginate = useCallback(
    (dir: number) => {
      if (!count) return;
      setState(([i]) => [(i + dir + count) % count, dir]);
    },
    [count]
  );

  const goTo = (i: number) => {
    setState(([cur]) => [i, i > cur ? 1 : -1]);
  };

  if (!hasImages) {
    return (
      <div
        className={`relative aspect-[16/9] rounded-3xl overflow-hidden bg-white/[0.03] border border-lime-500/15 flex items-center justify-center ${className}`}
      >
        <ImageOff size={32} className="text-slate-600" />
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden rounded-3xl group ${className}`}>
      {/* Slide */}
      <div className="relative aspect-[16/9] bg-[#0F1209]">
        <AnimatePresence initial={false} custom={direction} mode="popLayout">
          <motion.img
            key={index}
            src={validImages[index]}
            alt={`${alt} — image ${index + 1}`}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
            className="absolute inset-0 w-full h-full object-cover"
            draggable={false}
          />
        </AnimatePresence>

        {/* Count badge */}
        <div className="absolute top-4 right-4 z-20 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#0D0F0A]/80 backdrop-blur-md border border-lime-500/25 text-xs text-lime-200 font-body font-semibold">
          <span className="text-[#D0F219]">{index + 1}</span>
          <span className="text-slate-500">/</span>
          {count}
        </div>

        {/* Edge gradients for button visibility */}
        <div className="absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-black/30 to-transparent pointer-events-none z-10" />
        <div className="absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-black/30 to-transparent pointer-events-none z-10" />

        {/* Navigation buttons */}
        <button
          onClick={() => paginate(-1)}
          aria-label="Previous image"
          className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-[#12140E]/90 backdrop-blur-md border border-lime-500/30 text-[#D0F219] shadow-lg shadow-black/40 flex items-center justify-center hover:bg-[#D0F219] hover:text-[#12140E] hover:shadow-[0_0_20px_rgba(208,242,25,0.35)] active:scale-90 transition-all duration-200"
        >
          <ChevronLeft size={18} />
        </button>
        <button
          onClick={() => paginate(1)}
          aria-label="Next image"
          className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-[#12140E]/90 backdrop-blur-md border border-lime-500/30 text-[#D0F219] shadow-lg shadow-black/40 flex items-center justify-center hover:bg-[#D0F219] hover:text-[#12140E] hover:shadow-[0_0_20px_rgba(208,242,25,0.35)] active:scale-90 transition-all duration-200"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Indicator dots */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
        {validImages.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            aria-label={`Go to image ${i + 1}`}
            className={`rounded-full transition-all duration-300 ${
              i === index
                ? "w-6 h-2 bg-[#D0F219] shadow-[0_0_10px_rgba(208,242,25,0.5)]"
                : "w-2 h-2 bg-white/40 hover:bg-white/70"
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default BlogCarousel;
