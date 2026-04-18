"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useState } from "react";
import { LocationGate } from "@/components/LocationGate";
import { Nav } from "@/components/Nav";
import { StationList } from "@/components/StationList";
import type { StationsResponse } from "@/lib/types";

const StationMap = dynamic(() => import("@/components/StationMap"), {
  ssr: false,
  loading: () => <div className="h-[540px] animate-pulse rounded-lg bg-slate-100" />,
});

const RADIUS_OPTIONS = [3, 5, 10] as const;

type Location = { lat: number; lng: number; label?: string };

export default function Page() {
  const [location, setLocation] = useState<Location | null>(null);
  const [radius, setRadius] = useState<number>(5);
  const [view, setView] = useState<"list" | "map">("list");
  const [data, setData] = useState<StationsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (loc: Location, r: number) => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/stations?lat=${loc.lat}&lng=${loc.lng}&radius=${r}`);
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error ?? `Error ${res.status}`);
        }
        setData((await res.json()) as StationsResponse);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load stations");
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (location) void load(location, radius);
  }, [location, radius, load]);

  const lastUpdated = useMemo(() => {
    if (!data) return null;
    return new Date(data.updatedAt).toLocaleTimeString();
  }, [data]);

  if (!location) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Nav current="finder" />
        <main className="mx-auto flex max-w-5xl flex-col items-center justify-center px-4 py-12">
          <header className="mb-8 text-center">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Find gas nearby</h1>
            <p className="mt-1 text-slate-500">Live nearby gas prices, ranked cheapest first.</p>
          </header>
          <LocationGate onLocation={setLocation} />
        </main>
      </div>
    );
  }

  const estimated = data?.priceMode === "estimated";

  return (
    <div className="min-h-screen bg-slate-50">
      <Nav current="finder" />
      <main className="mx-auto max-w-6xl px-4 py-6">
      <header className="flex flex-col gap-4 border-b border-slate-200 pb-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Station Finder</h1>
          {location.label && (
            <p className="text-xs text-slate-500">Near {location.label}</p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-slate-600">
            Radius
            <select
              value={radius}
              onChange={(e) => setRadius(Number(e.target.value))}
              className="rounded-md border border-slate-300 bg-white px-2 py-1"
            >
              {RADIUS_OPTIONS.map((r) => (
                <option key={r} value={r}>
                  {r} mi
                </option>
              ))}
            </select>
          </label>
          <div className="flex rounded-md border border-slate-300 bg-white p-0.5 text-sm">
            <button
              type="button"
              className={`rounded px-3 py-1 ${view === "list" ? "bg-brand text-white" : "text-slate-600"}`}
              onClick={() => setView("list")}
            >
              List
            </button>
            <button
              type="button"
              className={`rounded px-3 py-1 ${view === "map" ? "bg-brand text-white" : "text-slate-600"}`}
              onClick={() => setView("map")}
            >
              Map
            </button>
          </div>
          <button
            type="button"
            onClick={() => location && load(location, radius)}
            disabled={loading}
            className="rounded-md border border-slate-300 bg-white px-3 py-1 text-sm hover:bg-slate-50 disabled:opacity-60"
          >
            {loading ? "Refreshing…" : "Refresh"}
          </button>
          {lastUpdated && (
            <span className="text-xs text-slate-500">Updated {lastUpdated}</span>
          )}
          <button
            type="button"
            onClick={() => setLocation(null)}
            className="text-xs text-slate-500 underline hover:text-slate-700"
          >
            Change location
          </button>
        </div>
      </header>

      {estimated && (
        <div className="mt-4 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          <strong>Prices are estimated.</strong> This build uses state-average baselines with
          per-brand adjustments, not live pump prices. Configure <code>PRICE_MODE=live</code>{" "}
          and a real adapter for live data.
        </div>
      )}
      {error && (
        <div className="mt-4 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <section className="mt-6">
        {loading && !data ? (
          <div className="rounded-lg border border-slate-200 bg-white p-6 text-center text-slate-500">
            Loading stations…
          </div>
        ) : data ? (
          view === "list" ? (
            <StationList stations={data.stations} />
          ) : (
            <StationMap stations={data.stations} center={data.center} radiusMi={data.radiusMi} />
          )
        ) : null}
      </section>

      <footer className="mt-8 border-t border-slate-200 pt-4 text-xs text-slate-400">
        Station data © OpenStreetMap contributors (ODbL). Geocoding via Nominatim. Prices are{" "}
        {estimated ? "estimated — see README for legal notes on real price data." : "from the configured live adapter."}
      </footer>
      </main>
    </div>
  );
}
