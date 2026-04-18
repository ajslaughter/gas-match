import { NextRequest, NextResponse } from "next/server";
import { cacheWrap, FIFTEEN_MIN } from "@/lib/cache";
import { rateLimited } from "@/lib/rateLimit";

export const runtime = "nodejs";

type NominatimResult = { lat: string; lon: string; display_name: string };

function userAgent(): string {
  const email = process.env.CONTACT_EMAIL ?? "dev@example.com";
  return `gas-match/0.1 (+${email})`;
}

async function geocodeZip(zip: string): Promise<{ lat: number; lng: number; label: string } | null> {
  const url = `https://nominatim.openstreetmap.org/search?postalcode=${encodeURIComponent(
    zip,
  )}&country=USA&format=json&limit=1`;

  const res = await rateLimited("nominatim", 1100, () =>
    fetch(url, { headers: { "User-Agent": userAgent(), Accept: "application/json" } }),
  );
  if (!res.ok) throw new Error(`Nominatim error: ${res.status}`);
  const data = (await res.json()) as NominatimResult[];
  const first = data[0];
  if (!first) return null;
  return { lat: Number(first.lat), lng: Number(first.lon), label: first.display_name };
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const zip = (searchParams.get("zip") ?? "").trim();
  if (!/^\d{5}$/.test(zip)) {
    return NextResponse.json({ error: "zip must be a 5-digit US ZIP" }, { status: 400 });
  }
  try {
    const result = await cacheWrap(`zip:${zip}`, FIFTEEN_MIN, () => geocodeZip(zip));
    if (!result) return NextResponse.json({ error: "ZIP not found" }, { status: 404 });
    return NextResponse.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "upstream error";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
