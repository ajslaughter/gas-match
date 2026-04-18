import type { PriceSet } from "./prices-estimated";

export type LivePriceLookup = (args: {
  stationId: string;
  brand: string | null;
  lat: number;
  lng: number;
}) => Promise<PriceSet | null>;

// Stub adapter for real-time price feeds. No shipping scraper by default.
//
// To plug in a real source, implement one of the TODOs below and wire it into
// /app/api/stations/route.ts when PRICE_MODE=live.
//
// Candidate feeds (read each provider's ToS before using):
//   * GasBuddy Business API — paid, contracts required.
//       https://business.gasbuddy.com/
//   * MyGasFeed — community feed, rate-limited, read their license first.
//   * State/municipal feeds — e.g. NJ Motor Fuels, CT/MA weekly reports.
//   * OPIS, EIA wholesale averages (not retail station-level).
//
// DO NOT scrape GasBuddy/Google/etc. in committed code: ToS violation + bot
// detection will break quickly. If you must experiment, keep it out of this
// repo and behind a local-only env flag.

export const fetchLivePrices: LivePriceLookup = async () => {
  // TODO: call your licensed provider here and map the response into PriceSet.
  // Return null to signal "no live data available for this station" so the
  // caller can choose to fall back to estimated prices or omit the station.
  return null;
};
