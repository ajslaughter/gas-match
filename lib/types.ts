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

export type FuelGrade = "regular" | "mid" | "premium" | "diesel";

export type StateAverage = {
  stateCode: string;
  stateName: string;
  fips: string;
  regular: number | null;
  mid: number | null;
  premium: number | null;
  diesel: number | null;
  updatedAt: string;
  source: "AAA" | "EIA";
};

export type StateAveragesResponse = {
  states: StateAverage[];
  national: Record<FuelGrade, number | null>;
  quintiles: Record<FuelGrade, [number, number, number, number]>;
  updatedAt: string;
  source: "AAA" | "EIA" | "mixed";
};
