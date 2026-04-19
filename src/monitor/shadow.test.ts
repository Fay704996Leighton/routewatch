import { buildShadowEntry, buildShadowReport, formatShadowReport, shadowToJson } from "./shadow";

describe("buildShadowEntry", () => {
  it("computes delta and deltaPercent", () => {
    const e = buildShadowEntry("https://api.example.com/users", 100, 150);
    expect(e.delta).toBe(50);
    expect(e.deltaPercent).toBe(50);
    expect(e.url).toBe("https://api.example.com/users");
  });

  it("handles negative delta", () => {
    const e = buildShadowEntry("https://api.example.com/items", 200, 180);
    expect(e.delta).toBe(-20);
    expect(e.deltaPercent).toBe(-10);
  });

  it("handles zero primary", () => {
    const e = buildShadowEntry("https://api.example.com/zero", 0, 50);
    expect(e.deltaPercent).toBe(0);
  });
});

describe("buildShadowReport", () => {
  it("returns empty report for no entries", () => {
    const r = buildShadowReport([]);
    expect(r.totalCompared).toBe(0);
    expect(r.avgDelta).toBe(0);
    expect(r.maxDelta).toBe(0);
  });

  it("computes avgDelta and maxDelta", () => {
    const entries = [
      buildShadowEntry("https://a.com/1", 100, 200),
      buildShadowEntry("https://a.com/2", 100, 110),
    ];
    const r = buildShadowReport(entries);
    expect(r.totalCompared).toBe(2);
    expect(r.maxDelta).toBe(100);
    expect(r.avgDelta).toBe(55);
  });
});

describe("formatShadowReport", () => {
  it("includes url and delta info", () => {
    const entries = [buildShadowEntry("https://api.test/v1", 80, 100)];
    const r = buildShadowReport(entries);
    const text = formatShadowReport(r);
    expect(text).toContain("https://api.test/v1");
    expect(text).toContain("+20ms");
  });
});

describe("shadowToJson", () => {
  it("serializes to valid JSON", () => {
    const r = buildShadowReport([]);
    const json = shadowToJson(r);
    expect(() => JSON.parse(json)).not.toThrow();
  });
});
