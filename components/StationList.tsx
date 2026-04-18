"use client";

import type { Station } from "@/lib/types";

function directionsUrl(s: Station): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${s.lat},${s.lng}`;
}

export function StationList({ stations }: { stations: Station[] }) {
  if (stations.length === 0) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-6 text-center text-slate-500">
        No stations found in this radius. Try a larger radius.
      </div>
    );
  }
  const cheapest = stations[0]?.prices.regular;
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-slate-600">
          <tr>
            <th className="px-3 py-2 text-left font-medium">Brand / Name</th>
            <th className="px-3 py-2 text-left font-medium">Address</th>
            <th className="px-3 py-2 text-right font-medium">Dist</th>
            <th className="px-3 py-2 text-right font-medium">Regular</th>
            <th className="px-3 py-2 text-right font-medium">Mid</th>
            <th className="px-3 py-2 text-right font-medium">Premium</th>
            <th className="px-3 py-2 text-right font-medium">Diesel</th>
            <th className="px-3 py-2 text-right font-medium">Go</th>
          </tr>
        </thead>
        <tbody>
          {stations.map((s) => {
            const isCheapest = s.prices.regular === cheapest;
            return (
              <tr
                key={s.id}
                className={
                  isCheapest
                    ? "border-t border-slate-200 bg-emerald-50"
                    : "border-t border-slate-200 hover:bg-slate-50"
                }
              >
                <td className="px-3 py-2">
                  <div className="font-medium">{s.brand}</div>
                  {s.name !== s.brand && <div className="text-xs text-slate-500">{s.name}</div>}
                </td>
                <td className="px-3 py-2 text-slate-600">{s.address || "—"}</td>
                <td className="px-3 py-2 text-right font-mono text-slate-600">{s.distanceMi.toFixed(1)}</td>
                <td className={`px-3 py-2 text-right font-mono ${isCheapest ? "font-bold text-emerald-700" : ""}`}>
                  ${s.prices.regular.toFixed(2)}
                </td>
                <td className="px-3 py-2 text-right font-mono">${s.prices.mid.toFixed(2)}</td>
                <td className="px-3 py-2 text-right font-mono">${s.prices.premium.toFixed(2)}</td>
                <td className="px-3 py-2 text-right font-mono">${s.prices.diesel.toFixed(2)}</td>
                <td className="px-3 py-2 text-right">
                  <a
                    className="text-brand underline hover:text-brand-dark"
                    href={directionsUrl(s)}
                    target="_blank"
                    rel="noreferrer noopener"
                  >
                    Directions
                  </a>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
