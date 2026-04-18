export type StateMeta = {
  code: string;
  name: string;
  fips: string;
  // EIA PADD region (Petroleum Administration for Defense District).
  padd: 1 | 2 | 3 | 4 | 5;
};

export const STATES: StateMeta[] = [
  { code: "AL", name: "Alabama", fips: "01", padd: 3 },
  { code: "AK", name: "Alaska", fips: "02", padd: 5 },
  { code: "AZ", name: "Arizona", fips: "04", padd: 5 },
  { code: "AR", name: "Arkansas", fips: "05", padd: 3 },
  { code: "CA", name: "California", fips: "06", padd: 5 },
  { code: "CO", name: "Colorado", fips: "08", padd: 4 },
  { code: "CT", name: "Connecticut", fips: "09", padd: 1 },
  { code: "DE", name: "Delaware", fips: "10", padd: 1 },
  { code: "DC", name: "District of Columbia", fips: "11", padd: 1 },
  { code: "FL", name: "Florida", fips: "12", padd: 1 },
  { code: "GA", name: "Georgia", fips: "13", padd: 1 },
  { code: "HI", name: "Hawaii", fips: "15", padd: 5 },
  { code: "ID", name: "Idaho", fips: "16", padd: 4 },
  { code: "IL", name: "Illinois", fips: "17", padd: 2 },
  { code: "IN", name: "Indiana", fips: "18", padd: 2 },
  { code: "IA", name: "Iowa", fips: "19", padd: 2 },
  { code: "KS", name: "Kansas", fips: "20", padd: 2 },
  { code: "KY", name: "Kentucky", fips: "21", padd: 2 },
  { code: "LA", name: "Louisiana", fips: "22", padd: 3 },
  { code: "ME", name: "Maine", fips: "23", padd: 1 },
  { code: "MD", name: "Maryland", fips: "24", padd: 1 },
  { code: "MA", name: "Massachusetts", fips: "25", padd: 1 },
  { code: "MI", name: "Michigan", fips: "26", padd: 2 },
  { code: "MN", name: "Minnesota", fips: "27", padd: 2 },
  { code: "MS", name: "Mississippi", fips: "28", padd: 3 },
  { code: "MO", name: "Missouri", fips: "29", padd: 2 },
  { code: "MT", name: "Montana", fips: "30", padd: 4 },
  { code: "NE", name: "Nebraska", fips: "31", padd: 2 },
  { code: "NV", name: "Nevada", fips: "32", padd: 5 },
  { code: "NH", name: "New Hampshire", fips: "33", padd: 1 },
  { code: "NJ", name: "New Jersey", fips: "34", padd: 1 },
  { code: "NM", name: "New Mexico", fips: "35", padd: 3 },
  { code: "NY", name: "New York", fips: "36", padd: 1 },
  { code: "NC", name: "North Carolina", fips: "37", padd: 1 },
  { code: "ND", name: "North Dakota", fips: "38", padd: 2 },
  { code: "OH", name: "Ohio", fips: "39", padd: 2 },
  { code: "OK", name: "Oklahoma", fips: "40", padd: 2 },
  { code: "OR", name: "Oregon", fips: "41", padd: 5 },
  { code: "PA", name: "Pennsylvania", fips: "42", padd: 1 },
  { code: "RI", name: "Rhode Island", fips: "44", padd: 1 },
  { code: "SC", name: "South Carolina", fips: "45", padd: 1 },
  { code: "SD", name: "South Dakota", fips: "46", padd: 2 },
  { code: "TN", name: "Tennessee", fips: "47", padd: 2 },
  { code: "TX", name: "Texas", fips: "48", padd: 3 },
  { code: "UT", name: "Utah", fips: "49", padd: 4 },
  { code: "VT", name: "Vermont", fips: "50", padd: 1 },
  { code: "VA", name: "Virginia", fips: "51", padd: 1 },
  { code: "WA", name: "Washington", fips: "53", padd: 5 },
  { code: "WV", name: "West Virginia", fips: "54", padd: 1 },
  { code: "WI", name: "Wisconsin", fips: "55", padd: 2 },
  { code: "WY", name: "Wyoming", fips: "56", padd: 4 },
];

const BY_NAME = new Map(STATES.map((s) => [s.name.toLowerCase(), s]));
const BY_CODE = new Map(STATES.map((s) => [s.code, s]));
const BY_FIPS = new Map(STATES.map((s) => [s.fips, s]));

export function byName(name: string): StateMeta | undefined {
  return BY_NAME.get(name.trim().toLowerCase());
}

export function byCode(code: string): StateMeta | undefined {
  return BY_CODE.get(code.toUpperCase());
}

export function byFips(fips: string): StateMeta | undefined {
  return BY_FIPS.get(fips.padStart(2, "0"));
}
