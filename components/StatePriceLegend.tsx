"use client";

import { QUINTILE_COLORS } from "@/lib/choropleth";
import type { FuelGrade } from "@/lib/types";

type Props = {
  grade: FuelGrade;
  onGradeChange: (g: FuelGrade) => void;
  breaks: [number, number, number, number];
  national: number | null;
  colorblind: boolean;
  onColorblindChange: (b: boolean) => void;
};

const GRADES: Array<{ key: FuelGrade; label: string }> = [
  { key: "regular", label: "Regular" },
  { key: "mid", label: "Mid" },
  { key: "premium", label: "Premium" },
  { key: "diesel", label: "Diesel" },
];

export function StatePriceLegend({
  grade,
  onGradeChange,
  breaks,
  national,
  colorblind,
  onColorblindChange,
}: Props) {
  const min = breaks[0];
  const max = breaks[3];
  const natPct =
    national !== null && max > min
      ? Math.max(0, Math.min(100, ((national - min) / (max - min)) * 100))
      : null;

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex rounded-md border border-slate-300 p-0.5 text-sm">
          {GRADES.map((g) => (
            <button
              key={g.key}
              type="button"
              onClick={() => onGradeChange(g.key)}
              className={
                grade === g.key
                  ? "rounded bg-brand px-3 py-1 text-white"
                  : "rounded px-3 py-1 text-slate-600 hover:bg-slate-50"
              }
            >
              {g.label}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 text-xs text-slate-600">
          <input
            type="checkbox"
            checked={colorblind}
            onChange={(e) => onColorblindChange(e.target.checked)}
          />
          Colorblind patterns
        </label>
      </div>

      <div className="mt-4">
        <div className="relative h-3 w-full overflow-hidden rounded">
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(to right, ${QUINTILE_COLORS.join(", ")})`,
            }}
          />
          {natPct !== null && (
            <div
              className="absolute -top-1 h-5 w-0.5 bg-slate-900"
              style={{ left: `${natPct}%` }}
              aria-label={`National average ${national?.toFixed(2)}`}
            />
          )}
        </div>
        <div className="mt-1 flex justify-between text-[11px] font-mono text-slate-500">
          <span>${min.toFixed(2)}</span>
          <span>${breaks[1].toFixed(2)}</span>
          <span>${breaks[2].toFixed(2)}</span>
          <span>${max.toFixed(2)}</span>
          <span>max</span>
        </div>
        {national !== null && (
          <p className="mt-2 text-xs text-slate-500">
            National avg: <span className="font-mono font-medium text-slate-800">${national.toFixed(2)}</span>
          </p>
        )}
      </div>
    </div>
  );
}
