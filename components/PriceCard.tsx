import type { Station } from "@/lib/types";

export function PriceCard({ station }: { station: Station }) {
  const { prices } = station;
  const rows: Array<[string, number]> = [
    ["Regular", prices.regular],
    ["Mid", prices.mid],
    ["Premium", prices.premium],
    ["Diesel", prices.diesel],
  ];
  return (
    <div className="text-sm">
      <div className="font-semibold">{station.name}</div>
      <div className="text-xs text-slate-500">{station.address || "Address unavailable"}</div>
      <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1">
        {rows.map(([label, value]) => (
          <div key={label} className="flex justify-between">
            <span className="text-slate-600">{label}</span>
            <span className="font-mono font-medium">${value.toFixed(2)}</span>
          </div>
        ))}
      </div>
      <div className="mt-2 text-[10px] uppercase tracking-wide text-slate-400">
        {station.priceSource === "estimated" ? "Estimated price" : "Live price"} · {station.distanceMi.toFixed(1)} mi
      </div>
    </div>
  );
}
