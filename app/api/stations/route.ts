import { NextRequest, NextResponse } from "next/server";
import { fetchStations, haversineMiles } from "@/lib/sources/overpass";
import { estimatedPrices } from "@/lib/sources/prices-estimated";
import { fetchLivePrices } from "@/lib/sources/prices-live";
import { normalizeBrand } from "@/lib/brands";
import type { Station, StationsResponse } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function parseNum(v: string | null): number | null {
  if (v === null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function stateFromAddress(addr: string): string | undefined {
  const m = addr.match(/,\s*([A-Z]{2})\s+\d{5}/);
  return m?.[1];
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lat = parseNum(searchParams.get("lat"));
  const lng = parseNum(searchParams.get("lng"));
  const radius = parseNum(searchParams.get("radius")) ?? 5;

  if (lat === null || lng === null) {
    return NextResponse.json({ error: "lat and lng are required" }, { status: 400 });
  }
  if (radius <= 0 || radius > 25) {
    return NextResponse.json({ error: "radius must be between 0 and 25 miles" }, { status: 400 });
  }

  const priceMode = (process.env.PRICE_MODE === "live" ? "live" : "estimated") as "live" | "estimated";
  const now = new Date().toISOString();

  let raw: Awaited<ReturnType<typeof fetchStations>>;
  try {
    raw = await fetchStations(lat, lng, radius);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "upstream error";
    return NextResponse.json({ error: msg }, { status: 502 });
  }

  const stations: Station[] = [];
  for (const s of raw) {
    const state = stateFromAddress(s.address);
    const brand = normalizeBrand(s.brand);
    let prices = estimatedPrices(s.id, s.brand, state);
    let priceSource: "estimated" | "live" = "estimated";

    if (priceMode === "live") {
      const live = await fetchLivePrices({
        stationId: s.id,
        brand: s.brand,
        lat: s.lat,
        lng: s.lng,
      });
      if (live) {
        prices = live;
        priceSource = "live";
      }
    }

    stations.push({
      id: s.id,
      brand: brand.displayName,
      brandKey: brand.key,
      brandLogo: brand.logo,
      name: s.name ?? brand.displayName,
      address: s.address,
      lat: s.lat,
      lng: s.lng,
      distanceMi: Math.round(haversineMiles({ lat, lng }, { lat: s.lat, lng: s.lng }) * 10) / 10,
      prices,
      updatedAt: now,
      priceSource,
    });
  }

  stations.sort((a, b) => a.prices.regular - b.prices.regular);

  const body: StationsResponse = {
    stations,
    radiusMi: radius,
    priceMode,
    center: { lat, lng },
    updatedAt: now,
  };
  return NextResponse.json(body);
}
