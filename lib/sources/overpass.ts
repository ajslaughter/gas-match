import { cacheWrap, FIFTEEN_MIN, roundCoord } from "../cache";
import { rateLimited } from "../rateLimit";

export type RawStation = {
  id: string;
  brand: string | null;
  name: string | null;
  address: string;
  lat: number;
  lng: number;
};

type OverpassElement = {
  type: "node" | "way" | "relation";
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
};

type OverpassResponse = { elements: OverpassElement[] };

const ENDPOINT = "https://overpass-api.de/api/interpreter";

function userAgent(): string {
  const email = process.env.CONTACT_EMAIL ?? "dev@example.com";
  return `gas-match/0.1 (+${email})`;
}

function formatAddress(tags: Record<string, string>): string {
  const parts = [
    [tags["addr:housenumber"], tags["addr:street"]].filter(Boolean).join(" "),
    tags["addr:city"],
    tags["addr:state"],
    tags["addr:postcode"],
  ].filter(Boolean);
  return parts.join(", ");
}

async function queryOverpass(lat: number, lng: number, radiusMeters: number): Promise<OverpassResponse> {
  const q = `[out:json][timeout:25];
(
  node["amenity"="fuel"](around:${radiusMeters},${lat},${lng});
  way["amenity"="fuel"](around:${radiusMeters},${lat},${lng});
  relation["amenity"="fuel"](around:${radiusMeters},${lat},${lng});
);
out center tags;`;

  const res = await rateLimited("overpass", 1100, () =>
    fetch(ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": userAgent(),
      },
      body: `data=${encodeURIComponent(q)}`,
    }),
  );

  if (!res.ok) {
    throw new Error(`Overpass error: ${res.status}`);
  }
  return (await res.json()) as OverpassResponse;
}

export async function fetchStations(
  lat: number,
  lng: number,
  radiusMiles: number,
): Promise<RawStation[]> {
  const radiusMeters = Math.round(radiusMiles * 1609.34);
  const key = `overpass:${roundCoord(lat)}:${roundCoord(lng)}:${radiusMiles}`;
  const data = await cacheWrap(key, FIFTEEN_MIN, () => queryOverpass(lat, lng, radiusMeters));

  const stations: RawStation[] = [];
  for (const el of data.elements) {
    const tags = el.tags ?? {};
    const point = el.type === "node" ? { lat: el.lat!, lon: el.lon! } : el.center;
    if (!point) continue;
    stations.push({
      id: `${el.type}/${el.id}`,
      brand: tags.brand ?? tags.operator ?? null,
      name: tags.name ?? tags.brand ?? tags.operator ?? null,
      address: formatAddress(tags),
      lat: point.lat,
      lng: point.lon,
    });
  }
  return stations;
}

export function haversineMiles(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 3958.8;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const la1 = toRad(a.lat);
  const la2 = toRad(b.lat);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
