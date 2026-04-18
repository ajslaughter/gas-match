"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ComposableMap, Geographies, Geography, Marker } from "react-simple-maps";
import { byFips } from "@/lib/geo/us-states";
import {
  NO_DATA_COLOR,
  QUINTILE_COLORS,
  QUINTILE_PATTERNS,
  colorFor,
  patternFor,
} from "@/lib/choropleth";
import type { FuelGrade, StateAverage } from "@/lib/types";
import { StateHoverCard } from "./StateHoverCard";

const GEO_URL = "/data/states-10m.json";

type Props = {
  states: StateAverage[];
  grade: FuelGrade;
  breaks: [number, number, number, number];
  national: Record<FuelGrade, number | null>;
  colorblind: boolean;
  focusCode: string | null;
  onFocusChange: (code: string | null) => void;
};

export function StateChoropleth({
  states,
  grade,
  breaks,
  national,
  colorblind,
  focusCode,
  onFocusChange,
}: Props) {
  const byFipsRow = useMemo(() => {
    const m = new Map<string, StateAverage>();
    for (const r of states) m.set(r.fips, r);
    return m;
  }, [states]);

  const byCodeRow = useMemo(() => {
    const m = new Map<string, StateAverage>();
    for (const r of states) m.set(r.stateCode, r);
    return m;
  }, [states]);

  const [hoverCode, setHoverCode] = useState<string | null>(null);
  const [pointer, setPointer] = useState<{ x: number; y: number } | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  const activeCode = focusCode ?? hoverCode;
  const activeRow = activeCode ? byCodeRow.get(activeCode) ?? null : null;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && focusCode) onFocusChange(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [focusCode, onFocusChange]);

  const handleMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!wrapRef.current) return;
    const rect = wrapRef.current.getBoundingClientRect();
    setPointer({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  }, []);

  return (
    <div ref={wrapRef} className="relative rounded-lg border border-slate-200 bg-white" onMouseMove={handleMove}>
      <svg width="0" height="0" aria-hidden="true" style={{ position: "absolute" }}>
        <defs>
          <pattern id={QUINTILE_PATTERNS[0]} patternUnits="userSpaceOnUse" width="6" height="6">
            <rect width="6" height="6" fill={QUINTILE_COLORS[0]} />
            <circle cx="3" cy="3" r="1" fill="white" />
          </pattern>
          <pattern id={QUINTILE_PATTERNS[1]} patternUnits="userSpaceOnUse" width="6" height="6">
            <rect width="6" height="6" fill={QUINTILE_COLORS[1]} />
            <path d="M0,6 L6,0" stroke="white" strokeWidth="1" />
          </pattern>
          <pattern id={QUINTILE_PATTERNS[2]} patternUnits="userSpaceOnUse" width="6" height="6">
            <rect width="6" height="6" fill={QUINTILE_COLORS[2]} />
            <path d="M0,3 L6,3 M3,0 L3,6" stroke="white" strokeWidth="0.7" />
          </pattern>
          <pattern id={QUINTILE_PATTERNS[3]} patternUnits="userSpaceOnUse" width="6" height="6">
            <rect width="6" height="6" fill={QUINTILE_COLORS[3]} />
            <path d="M0,0 L6,6" stroke="white" strokeWidth="1" />
          </pattern>
          <pattern id={QUINTILE_PATTERNS[4]} patternUnits="userSpaceOnUse" width="6" height="6">
            <rect width="6" height="6" fill={QUINTILE_COLORS[4]} />
            <path d="M0,0 L6,6 M0,6 L6,0" stroke="white" strokeWidth="0.8" />
          </pattern>
          <pattern id="pattern-na" patternUnits="userSpaceOnUse" width="5" height="5">
            <rect width="5" height="5" fill={NO_DATA_COLOR} />
          </pattern>
        </defs>
      </svg>

      <ComposableMap
        projection="geoAlbersUsa"
        width={975}
        height={610}
        style={{ width: "100%", height: "auto" }}
      >
        <Geographies geography={GEO_URL}>
          {({ geographies }) => {
            const sorted = [...geographies].sort((a, b) => String(a.id).localeCompare(String(b.id)));
            return sorted.map((geo) => {
              const fips = String(geo.id).padStart(2, "0");
              const meta = byFips(fips);
              const row = meta ? byFipsRow.get(fips) ?? null : null;
              const price = row ? row[grade] : null;
              const solid = colorFor(price, breaks);
              const fill = colorblind ? `url(#${patternFor(price, breaks)})` : solid;
              const isFocused = meta?.code === focusCode;
              const label = meta
                ? `${meta.name}: ${price === null ? "no data" : `$${price.toFixed(2)} ${grade}`}`
                : "Unknown";
              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  role="button"
                  tabIndex={0}
                  aria-label={label}
                  aria-pressed={isFocused}
                  onMouseEnter={() => meta && setHoverCode(meta.code)}
                  onMouseLeave={() => setHoverCode(null)}
                  onFocus={() => meta && setHoverCode(meta.code)}
                  onBlur={() => setHoverCode(null)}
                  onClick={() => {
                    if (!meta) return;
                    onFocusChange(focusCode === meta.code ? null : meta.code);
                  }}
                  onKeyDown={(e) => {
                    if (!meta) return;
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onFocusChange(focusCode === meta.code ? null : meta.code);
                    }
                  }}
                  style={{
                    default: {
                      fill,
                      stroke: "white",
                      strokeWidth: 0.5,
                      outline: "none",
                      transition: "fill 250ms, filter 150ms",
                    },
                    hover: {
                      fill: solid,
                      stroke: "white",
                      strokeWidth: 0.75,
                      outline: "none",
                      cursor: "pointer",
                      filter: "drop-shadow(0 2px 3px rgba(0,0,0,0.35))",
                    },
                    pressed: {
                      fill: solid,
                      stroke: "#0f172a",
                      strokeWidth: 1,
                      outline: "none",
                    },
                  }}
                />
              );
            });
          }}
        </Geographies>

        {/* DC dot + label — Albers USA clips DC to a sliver, so we show it as a marker */}
        <Marker coordinates={[-77.0369, 38.9072]}>
          <circle r={4} fill="#0f172a" stroke="white" strokeWidth={1.5} />
          <text
            x={8}
            y={3}
            style={{ fontSize: 10, fontFamily: "inherit", fill: "#0f172a" }}
          >
            DC
          </text>
        </Marker>
      </ComposableMap>

      {activeRow && pointer && (
        <div
          className="pointer-events-none absolute z-10"
          style={{
            left: Math.min(pointer.x + 14, (wrapRef.current?.clientWidth ?? 9999) - 280),
            top: Math.max(10, pointer.y - 10),
          }}
        >
          <div className="pointer-events-auto">
            <StateHoverCard
              state={activeRow}
              grade={grade}
              national={national}
              locked={focusCode !== null && focusCode === activeRow.stateCode}
              onClear={() => onFocusChange(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
