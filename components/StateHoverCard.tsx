"use client";

import type { FuelGrade, StateAverage } from "@/lib/types";

type Props = {
  state: StateAverage;
  grade: FuelGrade;
  national: Record<FuelGrade, number | null>;
  locked?: boolean;
  onClear?: () => void;
};

const GRADE_LABEL: Record<FuelGrade, string> = {
  regular: "Regular",
  mid: "Mid",
  premium: "Premium",
  diesel: "Diesel",
};

function formatPrice(v: number | null): string {
  return v === null ? "—" : `$${v.toFixed(2)}`;
}

function formatDelta(v: number | null, nat: number | null): string {
  if (v === null || nat === null) return "";
  const d = v - nat;
  const sign = d > 0 ? "+" : d < 0 ? "−" : "±";
  return `${sign}$${Math.abs(d).toFixed(2)} vs nat`;
}

export function StateHoverCard({ state, grade, national, locked, onClear }: Props) {
  return (
    <div className="w-64 rounded-lg border border-slate-200 bg-white p-3 shadow-lg">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-sm font-semibold text-slate-900">{state.stateName}</div>
          <div className="text-[10px] uppercase tracking-wide text-slate-400">
            {state.stateCode} · Source: {state.source}
          </div>
        </div>
        {locked && onClear && (
          <button
            type="button"
            onClick={onClear}
            className="text-xs text-slate-400 hover:text-slate-600"
            aria-label="Unlock state"
          >
            ✕
          </button>
        )}
      </div>
      <table className="mt-2 w-full text-sm">
        <tbody>
          {(Object.keys(GRADE_LABEL) as FuelGrade[]).map((g) => {
            const highlight = g === grade;
            return (
              <tr key={g} className={highlight ? "bg-slate-50" : ""}>
                <td className="py-0.5 pr-2 text-slate-600">{GRADE_LABEL[g]}</td>
                <td className="py-0.5 text-right font-mono">{formatPrice(state[g])}</td>
                <td className="py-0.5 pl-2 text-right text-[10px] font-mono text-slate-500">
                  {formatDelta(state[g], national[g])}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className="mt-2 text-[10px] text-slate-400">
        Updated {new Date(state.updatedAt).toLocaleString()}
      </div>
    </div>
  );
}
