"use client";

import { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

// Elements that expand the ring. Text fields are handled separately so the
// native I-beam stays usable while the custom cursor hides itself there.
const INTERACTIVE_SELECTOR =
  'a, button, [role="button"], [data-cursor-hover], .cursor-pointer, summary, label:has(input[type="checkbox"])';
const TEXT_SELECTOR = "input, textarea, select, [contenteditable='true']";

const CustomCursor: React.FC = () => {
  const [enabled, setEnabled] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [visible, setVisible] = useState(false);

  // ── Single source of truth ────────────────────────────────────────────────
  // One motion value pair + one spring drives the whole cursor container.
  // Because the dot and ring are both centered inside that same container,
  // the dot is physically locked inside the ring — it can never drift or
  // offset outside during fast mouse movements.
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const springX = useSpring(x, { stiffness: 320, damping: 24, mass: 0.4 });
  const springY = useSpring(y, { stiffness: 320, damping: 24, mass: 0.4 });

  useEffect(() => {
    // Only enable on devices with a fine pointer (mouse / trackpad).
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    setEnabled(true);

    const onMove = (e: MouseEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
      setVisible(true);
      const target = e.target as HTMLElement | null;
      const onText = !!target?.closest(TEXT_SELECTOR);
      setHovering(onText ? false : !!target?.closest(INTERACTIVE_SELECTOR));
      // Hide the custom cursor over text fields so the native I-beam is the only one.
      if (onText) setVisible(false);
    };

    const onLeave = () => setVisible(false);
    const onEnter = () => setVisible(true);

    window.addEventListener("mousemove", onMove, { passive: true });
    document.addEventListener("mouseleave", onLeave);
    document.addEventListener("mouseenter", onEnter);
    return () => {
      window.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseleave", onLeave);
      document.removeEventListener("mouseenter", onEnter);
    };
  }, [x, y]);

  if (!enabled) return null;

  return (
    // Single wrapper container — the entire cursor travels together via one spring.
    <motion.div
      aria-hidden
      className="pointer-events-none fixed left-0 top-0 z-[9998]"
      style={{ x: springX, y: springY, translateX: "-50%", translateY: "-50%" }}
      animate={{ opacity: visible ? 1 : 0 }}
      transition={{ duration: 0.15 }}
    >
      {/* Inner dot — centered, locked inside the ring */}
      <motion.div
        className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#ccff00] shadow-[0_0_10px_rgba(204,255,0,0.9)]"
        animate={{ scale: hovering ? 0.55 : 1 }}
        transition={{ duration: 0.15 }}
      />
      {/* Outer ring — transparent glowing border, expands on hover, centered on the dot */}
      <motion.div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border"
        animate={{
          width: hovering ? 46 : 32,
          height: hovering ? 46 : 32,
          borderColor: hovering ? "rgba(204,255,0,1)" : "rgba(204,255,0,0.7)",
          backgroundColor: hovering ? "rgba(204,255,0,0.08)" : "rgba(204,255,0,0)",
          boxShadow: hovering
            ? "0 0 24px rgba(204,255,0,0.45), inset 0 0 12px rgba(204,255,0,0.12)"
            : "0 0 12px rgba(204,255,0,0.22)",
        }}
        transition={{ duration: 0.2 }}
      />
    </motion.div>
  );
};

export default CustomCursor;
