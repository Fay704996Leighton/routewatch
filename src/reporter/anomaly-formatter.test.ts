import {
  buildAnomalyReport,
  formatAnomalyEntry,
  formatAnomalyReport,
  anomalyToJson,
} from "./anomaly-formatter";
import { AnomalyResult } from "../monitor/anomaly";

function makeAnomaly(overrides: Partial<AnomalyResult> = {}): AnomalyResult {
  return {
    url: "http://api.test/health",
    method: "GET",
    duration: 800,
    mean: 120,
    stddev: 15.5,
    zScore: 3.1,
    isAnomaly: true,
    ...overrides,
  };
}

describe("buildAnomalyReport", () => {
  it("maps anomaly results to report entries", () => {
    const entries = buildAnomalyReport([makeAnomaly()]);
    expect(entries).toHaveLength(1);
    expect(entries[0].url).toBe("http://api.test/health");
    expect(entries[0].zScore).toBe(3.1);
  });

  it("rounds duration and mean", () => {
    const entries = buildAnomalyReport([makeAnomaly({ duration: 800.9, mean: 120.4 })]);
    expect(entries[0].duration).toBe(801);
    expect(entries[0].mean).toBe(120);
  });
});

describe("formatAnomalyEntry", () => {
  it("includes ANOMALY flag when anomaly", () => {
    const entry = buildAnomalyReport([makeAnomaly()])[0];
    expect(formatAnomalyEntry(entry)).toContain("[ANOMALY]");
  });

  it("includes OK flag when not anomaly", () => {
    const entry = buildAnomalyReport([makeAnomaly({ isAnomaly: false, zScore: 0.5 })])[0];
    expect(formatAnomalyEntry(entry)).toContain("[OK]");
  });
});

describe("formatAnomalyReport", () => {
  it("returns fallback for empty list", () => {
    expect(formatAnomalyReport([])).toBe("No anomaly data.");
  });

  it("includes header and entries", () => {
    const entries = buildAnomalyReport([makeAnomaly()]);
    const report = formatAnomalyReport(entries);
    expect(report).toContain("Anomaly Detection Report");
    expect(report).toContain("http://api.test/health");
  });
});

describe("anomalyToJson", () => {
  it("serializes to valid JSON", () => {
    const entries = buildAnomalyReport([makeAnomaly()]);
    const json = anomalyToJson(entries);
    expect(() => JSON.parse(json)).not.toThrow();
    expect(JSON.parse(json)[0].url).toBe("http://api.test/health");
  });
});
