import { normalizeBrand } from "../brands";

export type PriceSet = {
  regular: number;
  mid: number;
  premium: number;
  diesel: number;
};

// AAA-style state averages (regular grade), refreshed manually.
// Source: AAA Gas Prices, representative snapshot — update periodically.
// Keys are USPS two-letter state codes; DC included.
const STATE_REGULAR: Record<string, number> = {
  AL: 2.89, AK: 3.45, AZ: 3.25, AR: 2.85, CA: 4.85, CO: 3.15, CT: 3.25, DE: 3.05,
  DC: 3.45, FL: 3.15, GA: 2.95, HI: 4.55, ID: 3.35, IL: 3.45, IN: 3.25, IA: 3.05,
  KS: 2.95, KY: 2.95, LA: 2.85, ME: 3.15, MD: 3.25, MA: 3.15, MI: 3.25, MN: 3.15,
  MS: 2.75, MO: 2.95, MT: 3.25, NE: 3.05, NV: 3.85, NH: 3.05, NJ: 3.15, NM: 3.05,
  NY: 3.25, NC: 2.95, ND: 3.15, OH: 3.15, OK: 2.85, OR: 3.95, PA: 3.35, RI: 3.15,
  SC: 2.85, SD: 3.15, TN: 2.85, TX: 2.85, UT: 3.45, VT: 3.15, VA: 3.05, WA: 4.15,
  WV: 3.05, WI: 3.05, WY: 3.25,
};

const DEFAULT_REGULAR = 3.10;

// Grade premiums over regular (typical national spreads).
const MID_PREMIUM = 0.40;
const PREMIUM_PREMIUM = 0.80;
const DIESEL_PREMIUM = 0.55;

// Deterministic per-station jitter so refreshes show stable variance.
function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 0xffffffff;
}

function jitter(stationId: string, range = 0.12): number {
  return (hashString(stationId) - 0.5) * 2 * range;
}

export function estimatedPrices(
  stationId: string,
  brandRaw: string | null | undefined,
  state: string | undefined,
): PriceSet {
  const base = (state && STATE_REGULAR[state.toUpperCase()]) || DEFAULT_REGULAR;
  const brand = normalizeBrand(brandRaw);
  const regular = round2(base + brand.priceAdjust + jitter(stationId));
  return {
    regular,
    mid: round2(regular + MID_PREMIUM + jitter(stationId + ":mid", 0.03)),
    premium: round2(regular + PREMIUM_PREMIUM + jitter(stationId + ":prem", 0.04)),
    diesel: round2(regular + DIESEL_PREMIUM + jitter(stationId + ":diesel", 0.05)),
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
