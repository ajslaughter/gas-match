import { NextResponse } from "next/server";
import { cacheWrap } from "@/lib/cache";
import { fetchAAAStateAverages } from "@/lib/sources/aaa";
import { fetchEIAStateAverages } from "@/lib/sources/eia";
import type { FuelGrade, StateAverage, StateAveragesResponse } from "@/lib/types";

export const runtime = "nodejs";
export const revalidate = 21600; // 6 hours

const SIX_HOURS = 6 * 60 * 60 * 1000;

const GRADES: FuelGrade[] = ["regular", "mid", "premium", "diesel"];

function quintileBreaks(values: number[]): [number, number, number, number] {
  const sorted = [...values].sort((a, b) => a - b);
  if (sorted.length === 0) return [0, 0, 0, 0];
  const q = (p: number) => sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * p))];
  return [q(0.2), q(0.4), q(0.6), q(0.8)];
}

function nationalAverage(rows: StateAverage[], grade: FuelGrade): number | null {
  const vals = rows.map((r) => r[grade]).filter((v): v is number => typeof v === "number");
  if (vals.length === 0) return null;
  return Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 100) / 100;
}

async function load(): Promise<StateAveragesResponse> {
  const now = new Date().toISOString();

  let rows: StateAverage[] = [];
  let source: "AAA" | "EIA" | "mixed" = "AAA";

  try {
    const aaa = await fetchAAAStateAverages();
    rows = aaa.rows;
    const priced = rows.filter((r) => r.regular !== null);
    // Require at least half the states to have data to trust AAA.
    if (priced.length < 25) throw new Error("AAA returned too few rows");
  } catch {
    const eia = await fetchEIAStateAverages();
    if (!eia) {
      // Both sources failed. Return null-priced rows so UI can render a
      // "data unavailable" state without crashing.
      rows = [];
      source = "AAA";
    } else {
      rows = eia.rows;
      source = "EIA";
    }
  }

  const national: Record<FuelGrade, number | null> = {
    regular: nationalAverage(rows, "regular"),
    mid: nationalAverage(rows, "mid"),
    premium: nationalAverage(rows, "premium"),
    diesel: nationalAverage(rows, "diesel"),
  };

  const quintiles = Object.fromEntries(
    GRADES.map((g) => {
      const vals = rows.map((r) => r[g]).filter((v): v is number => typeof v === "number");
      return [g, quintileBreaks(vals)];
    }),
  ) as Record<FuelGrade, [number, number, number, number]>;

  return { states: rows, national, quintiles, updatedAt: now, source };
}

export async function GET() {
  try {
    const body = await cacheWrap("state-averages:v1", SIX_HOURS, load);
    return NextResponse.json(body);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "upstream error";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
