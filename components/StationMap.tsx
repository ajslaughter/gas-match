"use client";

import { useMemo } from "react";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Station } from "@/lib/types";
import { PriceCard } from "./PriceCard";

function priceQuartile(price: number, breaks: number[]): number {
  for (let i = 0; i < breaks.length; i++) {
    if (price <= breaks[i]) return i;
  }
  return breaks.length;
}

const QUARTILE_COLORS = ["#059669", "#65a30d", "#d97706", "#dc2626"];

function makeIcon(color: string): L.DivIcon {
  return L.divIcon({
    className: "",
    html: `<div style="background:${color};width:22px;height:22px;border-radius:50%;border:2px solid white;box-shadow:0 0 0 1px rgba(0,0,0,0.3);"></div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  });
}

function computeBreaks(prices: number[]): number[] {
  if (prices.length === 0) return [];
  const sorted = [...prices].sort((a, b) => a - b);
  const q = (p: number) => sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * p))];
  return [q(0.25), q(0.5), q(0.75)];
}

type Props = {
  stations: Station[];
  center: { lat: number; lng: number };
  radiusMi: number;
};

export default function StationMap({ stations, center, radiusMi }: Props) {
  const breaks = useMemo(() => computeBreaks(stations.map((s) => s.prices.regular)), [stations]);
  const zoom = radiusMi <= 3 ? 13 : radiusMi <= 5 ? 12 : 11;

  return (
    <div className="h-[540px] overflow-hidden rounded-lg border border-slate-200">
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={zoom}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {stations.map((s) => {
          const color = QUARTILE_COLORS[priceQuartile(s.prices.regular, breaks)] ?? QUARTILE_COLORS[3];
          return (
            <Marker key={s.id} position={[s.lat, s.lng]} icon={makeIcon(color)}>
              <Popup>
                <PriceCard station={s} />
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
