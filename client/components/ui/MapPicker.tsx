"use client";

import dynamic from "next/dynamic";
import { Loader2, MapPin, Navigation } from "lucide-react";

// ─── Dynamic import (no SSR — Leaflet requires window) ─────────────────────────

const MapPickerInner = dynamic(() => import("./MapPickerInner"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-64 md:h-72 rounded-2xl bg-[#F8FAFC] border border-[#0284C7]/20 flex items-center justify-center">
      <div className="flex flex-col items-center gap-2">
        <Loader2 size={24} className="animate-spin text-[#0284C7]" />
        <span className="text-xs text-[#0284C7]/60 font-body">Loading map...</span>
      </div>
    </div>
  ),
});

// ─── Types ──────────────────────────────────────────────────────────────────────

interface MapPickerProps {
  latitude: number | null;
  longitude: number | null;
  onChange: (lat: number, lng: number) => void;
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAP PICKER (exported wrapper)
// ═══════════════════════════════════════════════════════════════════════════════

const MapPicker: React.FC<MapPickerProps> = ({ latitude, longitude, onChange }) => {
  const hasCoords = latitude !== null && longitude !== null;

  return (
    <div className="space-y-3">
      {/* Label */}
      <label className="text-xs font-semibold tracking-wider text-[#1E293B] uppercase font-body">
        Location on Map
      </label>

      {/* Map Container */}
      <div className="relative w-full h-64 md:h-72 rounded-2xl overflow-hidden border border-[#0284C7]/20 shadow-sm shadow-slate-900/10">
        <MapPickerInner
          latitude={latitude}
          longitude={longitude}
          onChange={onChange}
        />
      </div>

      {/* Coordinates Display */}
      <div className="flex items-center gap-3 text-xs text-[#0F172A]/60 font-body">
        <div className="flex items-center gap-1.5">
          <MapPin size={12} className="text-[#0284C7]" />
          <span>
            Lat:{" "}
            {hasCoords ? latitude!.toFixed(6) : "—"}
          </span>
        </div>
        <span className="text-[#0284C7]/30">|</span>
        <div className="flex items-center gap-1.5">
          <MapPin size={12} className="text-[#0284C7]" />
          <span>
            Lng:{" "}
            {hasCoords ? longitude!.toFixed(6) : "—"}
          </span>
        </div>
      </div>

      {/* Help text */}
      {!hasCoords && (
        <p className="text-xs text-[#0284C7]/70 font-body flex items-center gap-1.5">
          <Navigation size={12} />
          Click on the map to set a location, or allow browser location
        </p>
      )}
    </div>
  );
};

export default MapPicker;
