"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { Nav } from "@/components/Nav";
import { StatePriceLegend } from "@/components/StatePriceLegend";
import { StateRankTable } from "@/components/StateRankTable";
import type { FuelGrade, StateAveragesResponse } from "@/lib/types";

// The choropleth imports react-simple-maps which renders SVG tied to the DOM
// and doesn't love SSR — load it on the client only.
const StateChoropleth = dynamic(
  () => import("@/components/StateChoropleth").then((m) => m.StateChoropleth),
  {
    ssr: false,
    loading: () => <div className="h-[520px] animate-pulse rounded-lg bg-slate-100" />,
  },
);

export default function MapPage() {
  const [data, setData] = useState<StateAveragesResponse | null>(null);
  const [grade, setGrade] = useState<FuelGrade>("regular");
  const [colorblind, setColorblind] = useState(false);
  const [focusCode, setFocusCode] = useState<string | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/state-averages")
      .then(async (r) => {
        if (!r.ok) throw new Error(`Error ${r.status}`);
        return (await r.json()) as StateAveragesResponse;
      })
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load"));
  }, []);

  const breaks = data?.quintiles[grade] ?? ([0, 0, 0, 0] as [number, number, number, number]);
  const nationalForGrade = data?.national[grade] ?? null;

  const updatedLabel = useMemo(() => {
    if (!data) return "";
    return new Date(data.updatedAt).toLocaleString();
  }, [data]);

  return (
    <div className="min-h-screen bg-slate-50">
      <Nav current="map" />
      <main className="mx-auto max-w-6xl px-4 py-6">
        <header className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              State Gas Price Map
            </h1>
            <p className="text-sm text-slate-600">
              Choropleth of current state-average prices across the US.
              {data && (
                <>
                  {" "}
                  <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-700">
                    Source: {data.source}
                  </span>{" "}
                  <span className="text-xs text-slate-500">Updated {updatedLabel}</span>
                </>
              )}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setPanelOpen(true)}
            className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm hover:bg-slate-50"
          >
            Sort states
          </button>
        </header>

        {error && (
          <div className="mb-4 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        {data && (
          <div className="space-y-4">
            <StatePriceLegend
              grade={grade}
              onGradeChange={setGrade}
              breaks={breaks}
              national={nationalForGrade}
              colorblind={colorblind}
              onColorblindChange={setColorblind}
            />
            <StateChoropleth
              states={data.states}
              grade={grade}
              breaks={breaks}
              national={data.national}
              colorblind={colorblind}
              focusCode={focusCode}
              onFocusChange={setFocusCode}
            />
            <p className="text-xs text-slate-400">
              Tip: Tab through states, press Enter to lock the tooltip, Esc to unlock.
              Prices are state averages from {data.source} and refresh every 6 hours.
            </p>
          </div>
        )}

        {!data && !error && (
          <div className="h-[520px] animate-pulse rounded-lg bg-slate-100" />
        )}

        {data && (
          <StateRankTable
            states={data.states}
            grade={grade}
            national={nationalForGrade}
            open={panelOpen}
            onClose={() => setPanelOpen(false)}
            onSelect={(code) => {
              setFocusCode(code);
              setPanelOpen(false);
            }}
          />
        )}
      </main>
    </div>
  );
}
