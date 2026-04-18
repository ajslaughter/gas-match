export type BrandInfo = {
  key: string;
  displayName: string;
  logo: string;
  priceAdjust: number;
};

const BRANDS: Record<string, BrandInfo> = {
  costco: { key: "costco", displayName: "Costco", logo: "/brands/costco.svg", priceAdjust: -0.22 },
  sams: { key: "sams", displayName: "Sam's Club", logo: "/brands/sams.svg", priceAdjust: -0.18 },
  bjs: { key: "bjs", displayName: "BJ's", logo: "/brands/bjs.svg", priceAdjust: -0.15 },
  arco: { key: "arco", displayName: "Arco", logo: "/brands/arco.svg", priceAdjust: -0.12 },
  murphy: { key: "murphy", displayName: "Murphy USA", logo: "/brands/murphy.svg", priceAdjust: -0.10 },
  kroger: { key: "kroger", displayName: "Kroger", logo: "/brands/kroger.svg", priceAdjust: -0.08 },
  speedway: { key: "speedway", displayName: "Speedway", logo: "/brands/speedway.svg", priceAdjust: -0.04 },
  circlek: { key: "circlek", displayName: "Circle K", logo: "/brands/circlek.svg", priceAdjust: -0.02 },
  citgo: { key: "citgo", displayName: "Citgo", logo: "/brands/citgo.svg", priceAdjust: 0.00 },
  marathon: { key: "marathon", displayName: "Marathon", logo: "/brands/marathon.svg", priceAdjust: 0.01 },
  valero: { key: "valero", displayName: "Valero", logo: "/brands/valero.svg", priceAdjust: 0.02 },
  sunoco: { key: "sunoco", displayName: "Sunoco", logo: "/brands/sunoco.svg", priceAdjust: 0.03 },
  phillips66: { key: "phillips66", displayName: "Phillips 66", logo: "/brands/phillips66.svg", priceAdjust: 0.04 },
  bp: { key: "bp", displayName: "BP", logo: "/brands/bp.svg", priceAdjust: 0.05 },
  mobil: { key: "mobil", displayName: "Mobil", logo: "/brands/mobil.svg", priceAdjust: 0.06 },
  exxon: { key: "exxon", displayName: "Exxon", logo: "/brands/exxon.svg", priceAdjust: 0.07 },
  shell: { key: "shell", displayName: "Shell", logo: "/brands/shell.svg", priceAdjust: 0.09 },
  chevron: { key: "chevron", displayName: "Chevron", logo: "/brands/chevron.svg", priceAdjust: 0.11 },
  "76": { key: "76", displayName: "76", logo: "/brands/76.svg", priceAdjust: 0.08 },
  unknown: { key: "unknown", displayName: "Independent", logo: "/brands/unknown.svg", priceAdjust: -0.03 },
};

export function normalizeBrand(raw?: string | null): BrandInfo {
  if (!raw) return BRANDS.unknown;
  const s = raw.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (s.includes("costco")) return BRANDS.costco;
  if (s.includes("samsclub") || s === "sams") return BRANDS.sams;
  if (s.startsWith("bjs")) return BRANDS.bjs;
  if (s.includes("arco")) return BRANDS.arco;
  if (s.includes("murphy")) return BRANDS.murphy;
  if (s.includes("kroger") || s.includes("fredmeyer") || s.includes("kingsoopers") || s.includes("ralphs")) return BRANDS.kroger;
  if (s.includes("speedway")) return BRANDS.speedway;
  if (s.includes("circlek")) return BRANDS.circlek;
  if (s.includes("citgo")) return BRANDS.citgo;
  if (s.includes("marathon")) return BRANDS.marathon;
  if (s.includes("valero")) return BRANDS.valero;
  if (s.includes("sunoco")) return BRANDS.sunoco;
  if (s.includes("phillips66") || s === "p66") return BRANDS.phillips66;
  if (s === "bp" || s.startsWith("bp")) return BRANDS.bp;
  if (s.includes("mobil")) return BRANDS.mobil;
  if (s.includes("exxon")) return BRANDS.exxon;
  if (s.includes("shell")) return BRANDS.shell;
  if (s.includes("chevron")) return BRANDS.chevron;
  if (s === "76" || s.includes("seventysix")) return BRANDS["76"];
  return BRANDS.unknown;
}

export function allBrands(): BrandInfo[] {
  return Object.values(BRANDS);
}
