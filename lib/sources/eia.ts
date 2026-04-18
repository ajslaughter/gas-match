import { STATES } from "../geo/us-states";
import type { StateAverage } from "../types";

// EIA (Energy Information Administration) weekly retail price API, v2.
// Docs: https://www.eia.gov/opendata/
//
// Free with an API key. We use the weekly PADD-region averages for regular
// gasoline + diesel and project them to all states in that PADD. This is a
// coarse fallback — AAA's actual state table is much better — but it means
// the map still renders when AAA parsing breaks.
//
// Series IDs we care about (weekly retail, all formulations):
//   EMM_EPMR_PTE_R{1..5}0_DPG  — regular gasoline per PADD
//   EMD_EPD2D_PTE_R{1..5}0_DPG — ultra-low-sulfur diesel per PADD
// Mid/premium aren't published per-PADD on the weekly series, so we
// approximate with the typical national spreads.
const MID_SPREAD = 0.40;
const PREM_SPREAD = 0.80;

type EiaResponse = {
  response?: {
    data?: Array<{ value: number | string; "series-description"?: string; duoarea?: string; period?: string }>;
  };
};

async function fetchSeries(seriesId: string, apiKey: string): Promise<{ value: number; period: string } | null> {
  const url = new URL("https://api.eia.gov/v2/seriesid/" + seriesId);
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("length", "1");
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) return null;
  const json = (await res.json()) as EiaResponse;
  const row = json.response?.data?.[0];
  if (!row) return null;
  const v = typeof row.value === "string" ? Number(row.value) : row.value;
  if (!Number.isFinite(v)) return null;
  return { value: v, period: row.period ?? "" };
}

export async function fetchEIAStateAverages(): Promise<{ rows: StateAverage[]; updatedAt: string } | null> {
  const apiKey = process.env.EIA_API_KEY;
  if (!apiKey) return null;

  const now = new Date().toISOString();
  const padds: Array<1 | 2 | 3 | 4 | 5> = [1, 2, 3, 4, 5];

  const regularByPadd = new Map<number, number>();
  const dieselByPadd = new Map<number, number>();

  for (const p of padds) {
    const [reg, dsl] = await Promise.all([
      fetchSeries(`PET.EMM_EPMR_PTE_R${p}0_DPG.W`, apiKey),
      fetchSeries(`PET.EMD_EPD2D_PTE_R${p}0_DPG.W`, apiKey),
    ]);
    if (reg) regularByPadd.set(p, reg.value);
    if (dsl) dieselByPadd.set(p, dsl.value);
  }

  if (regularByPadd.size === 0) return null;

  const rows: StateAverage[] = STATES.map((meta) => {
    const regular = regularByPadd.get(meta.padd) ?? null;
    const diesel = dieselByPadd.get(meta.padd) ?? null;
    return {
      stateCode: meta.code,
      stateName: meta.name,
      fips: meta.fips,
      regular,
      mid: regular !== null ? round2(regular + MID_SPREAD) : null,
      premium: regular !== null ? round2(regular + PREM_SPREAD) : null,
      diesel,
      updatedAt: now,
      source: "EIA",
    };
  });

  return { rows, updatedAt: now };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
