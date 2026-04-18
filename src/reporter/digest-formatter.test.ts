import { describe, it, expect } from "vitest";
import { formatDigestReport, digestToJson } from "./digest-formatter";
import { DigestReport } from "../monitor/digest";

function makeDigest(overrides: Partial<DigestReport> = {}): DigestReport {
  return {
    generatedAt: "2024-01-01T00:00:00.000Z",
    window: "24h",
    totalEndpoints: 5,
    alertCount: 3,
    criticalCount: 1,
    warnCount: 2,
    topDegradedRoutes: ["https://api.example.com/slow"],
    uptimeSummary: { avg: 98.5, min: 95.0 },
    trendSummary: { improving: 1, degrading: 2, stable: 2 },
    alerts: [],
    ...overrides,
  };
}

describe("formatDigestReport", () => {
  it("includes window and generated time", () => {
    const out = formatDigestReport(makeDigest());
    expect(out).toContain("24h");
    expect(out).toContain("2024-01-01T00:00:00.000Z");
  });

  it("shows alert counts", () => {
    const out = formatDigestReport(makeDigest());
    expect(out).toContain("critical: 1");
    expect(out).toContain("warn: 2");
  });

  it("shows uptime summary", () => {
    const out = formatDigestReport(makeDigest());
    expect(out).toContain("98.5%");
    expect(out).toContain("95%");
  });

  it("lists degraded routes", () => {
    const out = formatDigestReport(makeDigest());
    expect(out).toContain("https://api.example.com/slow");
  });

  it("omits degraded section when none", () => {
    const out = formatDigestReport(makeDigest({ topDegradedRoutes: [] }));
    expect(out).not.toContain("Top degraded");
  });

  it("shows trend summary", () => {
    const out = formatDigestReport(makeDigest());
    expect(out).toContain("1 improving");
    expect(out).toContain("2 degrading");
  });
});

describe("digestToJson", () => {
  it("serializes to valid JSON", () => {
    const d = makeDigest();
    const json = JSON.parse(digestToJson(d));
    expect(json.totalEndpoints).toBe(5);
    expect(json.trendSummary.stable).toBe(2);
  });
});
