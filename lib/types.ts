import type { PriceSet } from "./sources/prices-estimated";

export type Station = {
  id: string;
  brand: string;
  brandKey: string;
  brandLogo: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  distanceMi: number;
  prices: PriceSet;
  updatedAt: string;
  priceSource: "estimated" | "live";
};

export type StationsResponse = {
  stations: Station[];
  radiusMi: number;
  priceMode: "estimated" | "live";
  center: { lat: number; lng: number };
  updatedAt: string;
};
