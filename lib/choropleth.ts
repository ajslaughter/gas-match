import type { FuelGrade, StateAverage } from "./types";

export const QUINTILE_COLORS = [
  "#14532d", // cheapest
  "#86efac",
  "#fef3c7",
  "#fb923c",
  "#991b1b", // most expensive
] as const;

export const QUINTILE_PATTERNS = [
  "pattern-q0",
  "pattern-q1",
  "pattern-q2",
  "pattern-q3",
  "pattern-q4",
] as const;

export const NO_DATA_COLOR = "#e5e7eb";

export function quintileIndex(
  price: number | null,
  breaks: [number, number, number, number],
): number | null {
  if (price === null || !Number.isFinite(price)) return null;
  if (price <= breaks[0]) return 0;
  if (price <= breaks[1]) return 1;
  if (price <= breaks[2]) return 2;
  if (price <= breaks[3]) return 3;
  return 4;
}

export function colorFor(price: number | null, breaks: [number, number, number, number]): string {
  const idx = quintileIndex(price, breaks);
  if (idx === null) return NO_DATA_COLOR;
  return QUINTILE_COLORS[idx];
}

export function patternFor(price: number | null, breaks: [number, number, number, number]): string {
  const idx = quintileIndex(price, breaks);
  if (idx === null) return "pattern-na";
  return QUINTILE_PATTERNS[idx];
}

export function sortStates(rows: StateAverage[], grade: FuelGrade, dir: "asc" | "desc" = "asc"): StateAverage[] {
  return [...rows].sort((a, b) => {
    const av = a[grade];
    const bv = b[grade];
    if (av === null && bv === null) return a.stateName.localeCompare(b.stateName);
    if (av === null) return 1;
    if (bv === null) return -1;
    return dir === "asc" ? av - bv : bv - av;
  });
}
