import * as cheerio from "cheerio";
import { byName, STATES } from "../geo/us-states";
import type { StateAverage } from "../types";

export const AAA_URL = "https://gasprices.aaa.com/state-gas-price-averages/";

function userAgent(): string {
  const email = process.env.CONTACT_EMAIL ?? "dev@example.com";
  return `gas-match/0.1 (+${email}) server-side cached snapshot`;
}

function parsePrice(raw: string | undefined | null): number | null {
  if (!raw) return null;
  const m = raw.replace(/[^0-9.]/g, "").match(/\d+(?:\.\d+)?/);
  if (!m) return null;
  const n = Number(m[0]);
  return Number.isFinite(n) && n > 0.5 && n < 15 ? n : null;
}

export type AAAParseResult = {
  rows: StateAverage[];
  updatedAt: string;
};

/**
 * Parse the AAA state-gas-price-averages HTML table.
 *
 * The target markup is a table with one row per state. Column order is
 * State, Regular, Mid, Premium, Diesel. Column headers are matched by text
 * so the parser is resilient to minor table-class renames.
 */
export function parseAAAHtml(html: string, now: Date = new Date()): AAAParseResult {
  const $ = cheerio.load(html);
  const table = $("table").first();
  if (!table.length) return { rows: [], updatedAt: now.toISOString() };

  const headers = table
    .find("thead th, tr:first-child th, tr:first-child td")
    .map((_, el) => $(el).text().trim().toLowerCase())
    .get();

  const colFor = (keys: string[]): number =>
    headers.findIndex((h) => keys.some((k) => h.includes(k)));

  const stateCol = Math.max(0, colFor(["state"]));
  const regCol = colFor(["regular"]);
  const midCol = colFor(["mid"]);
  const premCol = colFor(["premium"]);
  const dieselCol = colFor(["diesel"]);

  const rows: StateAverage[] = [];
  table.find("tbody tr").each((_, tr) => {
    const cells = $(tr).find("td");
    if (cells.length === 0) return;
    const stateName = $(cells.get(stateCol)).text().trim();
    if (!stateName) return;
    const meta = byName(stateName);
    if (!meta) return;
    rows.push({
      stateCode: meta.code,
      stateName: meta.name,
      fips: meta.fips,
      regular: regCol >= 0 ? parsePrice($(cells.get(regCol)).text()) : null,
      mid: midCol >= 0 ? parsePrice($(cells.get(midCol)).text()) : null,
      premium: premCol >= 0 ? parsePrice($(cells.get(premCol)).text()) : null,
      diesel: dieselCol >= 0 ? parsePrice($(cells.get(dieselCol)).text()) : null,
      updatedAt: now.toISOString(),
      source: "AAA",
    });
  });

  // Fill in any missing states with null rows so the map always covers all 50+DC.
  const seen = new Set(rows.map((r) => r.stateCode));
  for (const meta of STATES) {
    if (!seen.has(meta.code)) {
      rows.push({
        stateCode: meta.code,
        stateName: meta.name,
        fips: meta.fips,
        regular: null,
        mid: null,
        premium: null,
        diesel: null,
        updatedAt: now.toISOString(),
        source: "AAA",
      });
    }
  }

  return { rows, updatedAt: now.toISOString() };
}

export async function fetchAAAStateAverages(): Promise<AAAParseResult> {
  const res = await fetch(AAA_URL, {
    headers: {
      "User-Agent": userAgent(),
      Accept: "text/html,application/xhtml+xml",
      "Accept-Language": "en-US,en;q=0.9",
    },
    // Next.js route segment cache also kicks in via the route's revalidate setting.
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`AAA fetch failed: ${res.status}`);
  }
  const html = await res.text();
  return parseAAAHtml(html);
}
