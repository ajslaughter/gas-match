"use client";

import { sortStates } from "@/lib/choropleth";
import type { FuelGrade, StateAverage } from "@/lib/types";

type Props = {
  states: StateAverage[];
  grade: FuelGrade;
  national: number | null;
  open: boolean;
  onClose: () => void;
  onSelect: (code: string) => void;
};

const GRADE_LABEL: Record<FuelGrade, string> = {
  regular: "Regular",
  mid: "Mid",
  premium: "Premium",
  diesel: "Diesel",
};

export function StateRankTable({ states, grade, national, open, onClose, onSelect }: Props) {
  if (!open) return null;
  const sorted = sortStates(states, grade, "asc");
  return (
    <aside className="fixed inset-y-0 right-0 z-30 w-full max-w-sm overflow-y-auto border-l border-slate-200 bg-white p-4 shadow-xl">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">States ranked</h2>
          <p className="text-xs text-slate-500">
            Cheapest to most expensive — {GRADE_LABEL[grade]}
            {national !== null && <span> · nat ${national.toFixed(2)}</span>}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded px-2 py-1 text-sm text-slate-500 hover:bg-slate-100"
          aria-label="Close ranked list"
        >
          ✕
        </button>
      </header>
      <table className="mt-4 w-full text-sm">
        <thead className="sticky top-0 bg-white text-slate-500">
          <tr>
            <th className="py-1 pr-2 text-left font-medium">#</th>
            <th className="py-1 pr-2 text-left font-medium">State</th>
            <th className="py-1 pr-2 text-right font-medium">Price</th>
            <th className="py-1 text-right font-medium">Δ vs nat</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((s, i) => {
            const price = s[grade];
            const delta = price !== null && national !== null ? price - national : null;
            return (
              <tr
                key={s.stateCode}
                className="cursor-pointer border-t border-slate-100 hover:bg-slate-50"
                onClick={() => onSelect(s.stateCode)}
              >
                <td className="py-1 pr-2 font-mono text-slate-400">{i + 1}</td>
                <td className="py-1 pr-2">{s.stateName}</td>
                <td className="py-1 pr-2 text-right font-mono">
                  {price === null ? "—" : `$${price.toFixed(2)}`}
                </td>
                <td
                  className={
                    "py-1 text-right font-mono " +
                    (delta === null
                      ? "text-slate-400"
                      : delta > 0
                      ? "text-red-700"
                      : "text-emerald-700")
                  }
                >
                  {delta === null ? "—" : `${delta > 0 ? "+" : "−"}$${Math.abs(delta).toFixed(2)}`}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </aside>
  );
}
