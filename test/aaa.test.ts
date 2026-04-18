import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { parseAAAHtml } from "../lib/sources/aaa";
import { STATES } from "../lib/geo/us-states";

const fixture = readFileSync(join(__dirname, "fixtures", "aaa.html"), "utf8");

describe("AAA parser", () => {
  it("extracts prices for every state present in the fixture", () => {
    const { rows } = parseAAAHtml(fixture);
    const byCode = new Map(rows.map((r) => [r.stateCode, r]));

    const ca = byCode.get("CA")!;
    expect(ca.stateName).toBe("California");
    expect(ca.regular).toBeCloseTo(4.853, 3);
    expect(ca.mid).toBeCloseTo(5.253, 3);
    expect(ca.premium).toBeCloseTo(5.653, 3);
    expect(ca.diesel).toBeCloseTo(5.403, 3);
    expect(ca.source).toBe("AAA");

    expect(byCode.get("AL")!.regular).toBeCloseTo(2.892, 3);
    expect(byCode.get("NY")!.regular).toBeCloseTo(3.251, 3);
    expect(byCode.get("TX")!.regular).toBeCloseTo(2.851, 3);
    expect(byCode.get("DC")!.regular).toBeCloseTo(3.452, 3);
  });

  it("emits a row for every state+DC so the map is always fully populated", () => {
    const { rows } = parseAAAHtml(fixture);
    expect(rows.length).toBe(STATES.length);
    for (const meta of STATES) {
      const row = rows.find((r) => r.stateCode === meta.code);
      expect(row, `missing row for ${meta.code}`).toBeTruthy();
      expect(row!.fips).toBe(meta.fips);
    }
  });

  it("returns null prices for states not present in the HTML", () => {
    const { rows } = parseAAAHtml(fixture);
    const hi = rows.find((r) => r.stateCode === "HI")!;
    expect(hi.regular).toBeNull();
    expect(hi.diesel).toBeNull();
  });

  it("sets an ISO updatedAt on every row", () => {
    const now = new Date("2026-04-18T12:00:00.000Z");
    const { rows, updatedAt } = parseAAAHtml(fixture, now);
    expect(updatedAt).toBe("2026-04-18T12:00:00.000Z");
    for (const r of rows) expect(r.updatedAt).toBe(updatedAt);
  });

  it("handles missing table gracefully", () => {
    const { rows } = parseAAAHtml("<html><body>no table here</body></html>");
    expect(rows).toEqual([]);
  });
});
