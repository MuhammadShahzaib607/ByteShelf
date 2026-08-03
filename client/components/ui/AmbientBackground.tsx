"use client";

import { useEffect, useRef } from "react";

// ═══════════════════════════════════════════════════════════════════════════════
// AMBIENT BACKGROUND — Awwwards-style motion layer (orbs + veil + grid + aura)
// Purely decorative: pointer-events-none + aria-hidden. The mouse aura listens on
// `window` (rAF-lerped via CSS custom props) so it works behind any layout.
// ═══════════════════════════════════════════════════════════════════════════════

export default function AmbientBackground() {
  const auraRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<number | null>(null);
  const targetRef = useRef({ x: -9999, y: -9999 });
  const currentRef = useRef({ x: -9999, y: -9999 });

  // ─── Mouse-follow lime aura (rAF-lerped, no React re-renders) ──────────
  useEffect(() => {
    const aura = auraRef.current;
    if (!aura) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

    const onMove = (e: MouseEvent) => {
      const rect = aura.parentElement?.getBoundingClientRect();
      if (!rect) return;
      targetRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };

    const tick = () => {
      currentRef.current.x +=
        (targetRef.current.x - currentRef.current.x) * 0.1;
      currentRef.current.y +=
        (targetRef.current.y - currentRef.current.y) * 0.1;
      aura.style.setProperty(
        "--aura-x",
        `${currentRef.current.x.toFixed(1)}px`
      );
      aura.style.setProperty(
        "--aura-y",
        `${currentRef.current.y.toFixed(1)}px`
      );
      frameRef.current = requestAnimationFrame(tick);
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    frameRef.current = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("mousemove", onMove);
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, []);

  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden="true"
    >
      {/* ─── Floating fluid orbs (lime green / electric teal / dark slate) ─── */}
      <div className="absolute inset-0">
        <div className="auth-orb animate-auth-orb-1 -top-44 -left-36 w-[36rem] h-[36rem] bg-[#84cc16]/20" />
        <div className="auth-orb animate-auth-orb-2 top-1/3 -right-48 w-[32rem] h-[32rem] bg-teal-500/30" />
        <div className="auth-orb animate-auth-orb-3 -bottom-56 left-1/4 w-[40rem] h-[40rem] bg-[#84cc16]/30" />
        <div className="auth-orb animate-auth-orb-4 top-1/4 left-1/2 w-96 h-96 bg-slate-600/30" />
        <div className="auth-orb animate-auth-orb-2 top-8 left-1/6 w-80 h-80 bg-[#84cc16]/15" />
      </div>

      {/* ─── Dark noise / blur layer over the orbs ─── */}
      <div className="absolute inset-0 bg-[#05080e]/25 backdrop-blur-3xl" />

      {/* ─── Tech grid overlay ─── */}
      <div className="absolute inset-0 bg-[radial-gradient(#84cc16_1px,transparent_1px)] [background-size:32px_32px] opacity-10" />

      {/* ─── Mouse-follow lime aura ─── */}
      <div
        ref={auraRef}
        className="absolute inset-0 z-[1]"
        style={{
          background:
            "radial-gradient(420px circle at var(--aura-x, -9999px) var(--aura-y, -9999px), rgba(132,204,22,0.10), transparent 60%)",
        }}
      />
    </div>
  );
}
