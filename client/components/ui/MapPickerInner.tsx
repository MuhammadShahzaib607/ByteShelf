"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// ─── Fix default marker icons ──────────────────────────────────────────────────

const defaultIcon = L.icon({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

L.Marker.prototype.options.icon = defaultIcon;

// ─── Types ──────────────────────────────────────────────────────────────────────

interface MapPickerInnerProps {
  latitude: number | null;
  longitude: number | null;
  onChange: (lat: number, lng: number) => void;
}

const DEFAULT_CENTER: [number, number] = [20.5937, 78.9629];
const DEFAULT_ZOOM = 5;

// ─── ClickHandler ───────────────────────────────────────────────────────────────

function ClickHandler({
  onClick,
}: {
  onClick: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      onClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

// ─── FlyToCenter ────────────────────────────────────────────────────────────────

function FlyToCenter({
  center,
}: {
  center: [number, number];
}) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, 15, { duration: 0.5 });
    }
  }, [center, map]);
  return null;
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAP PICKER INNER
// ═══════════════════════════════════════════════════════════════════════════════

const MapPickerInner: React.FC<MapPickerInnerProps> = ({
  latitude,
  longitude,
  onChange,
}) => {
  const [initialCenter, setInitialCenter] = useState<[number, number]>(DEFAULT_CENTER);
  const [initialZoom] = useState(DEFAULT_ZOOM);
  const [geoDone, setGeoDone] = useState(false);

  // Auto-detect user location on mount
  useEffect(() => {
    if (geoDone) return;

    if (latitude !== null && longitude !== null) {
      setInitialCenter([latitude, longitude]);
      setGeoDone(true);
      return;
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setInitialCenter([lat, lng]);
          onChange(lat, lng);
          setGeoDone(true);
        },
        () => {
          setGeoDone(true);
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    } else {
      setGeoDone(true);
    }
  }, [latitude, longitude, onChange, geoDone]);

  // Marker position
  const hasCoords = latitude !== null && longitude !== null;
  const markerPos: [number, number] | null = hasCoords
    ? [latitude!, longitude!]
    : null;

  return (
    <MapContainer
      center={initialCenter}
      zoom={initialZoom}
      className="w-full h-full z-0 rounded-2xl"
      scrollWheelZoom={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <ClickHandler onClick={onChange} />

      {markerPos && (
        <Marker
          position={markerPos}
          draggable={true}
          eventHandlers={{
            dragend: (e) => {
              const latlng = e.target.getLatLng();
              onChange(latlng.lat, latlng.lng);
            },
          }}
        />
      )}

      {markerPos && <FlyToCenter center={markerPos} />}
    </MapContainer>
  );
};

export default MapPickerInner;
