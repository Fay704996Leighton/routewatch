import { detectRegression, RegressionConfig } from "./regression";
import { BaselineEntry } from "./baseline";
import { PollResult } from "./types";

function makeBaseline(avg: number, p95: number): BaselineEntry {
  return {
    url: "http://api.example.com/health",
    avgDuration: avg,
    p95Duration: p95,
    sampleCount: 20,
    recordedAt: "2024-01-01T00:00:00.000Z",
  };
}

function makeResults(durations: number[]): PollResult[] {
  return durations.map((d) => ({
    url: "http://api.example.com/health",
    status: 200,
    durationMs: d,
    body: "{}",
    timestamp: new Date().toISOString(),
  }));
}

const config: RegressionConfig = { avgThresholdPct: 20, p95ThresholdPct: 30 };

describe("detectRegression", () => {
  it("reports no regression when durations are within threshold", () => {
    const baseline = makeBaseline(100, 150);
    const results = makeResults([100, 105, 110, 95, 100]);
    const result = detectRegression(results, baseline, config);
    expect(result.isRegression).toBe(false);
    expect(result.reason).toHaveLength(0);
  });

  it("detects avg regression when avg exceeds threshold", () => {
    const baseline = makeBaseline(100, 150);
    const results = makeResults([130, 140, 125, 135, 130]);
    const result = detectRegression(results, baseline, config);
    expect(result.isRegression).toBe(true);
    expect(result.reason.some((r) => r.includes("avg duration"))).toBe(true);
  });

  it("detects p95 regression independently", () => {
    const baseline = makeBaseline(100, 150);
    // avg stays close but p95 spikes
    const results = makeResults([100, 100, 100, 100, 250]);
    const result = detectRegression(results, baseline, config);
    expect(result.isRegression).toBe(true);
    expect(result.reason.some((r) => r.includes("p95"))).toBe(true);
  });

  it("detects both avg and p95 regression simultaneously", () => {
    const baseline = makeBaseline(100, 150);
    // Both avg and p95 exceed their respective thresholds
    const results = makeResults([130, 140, 130, 140, 400]);
    const result = detectRegression(results, baseline, config);
    expect(result.isRegression).toBe(true);
    expect(result.reason.some((r) => r.includes("avg duration"))).toBe(true);
    expect(result.reason.some((r) => r.includes("p95"))).toBe(true);
  });

  it("returns correct delta percentages", () => {
    const baseline = makeBaseline(200, 300);
    const results = makeResults([200, 200, 200, 200, 200]);
    const result = detectRegression(results, baseline, config);
    expect(result.avgDeltaPct).toBe(0);
  });

  it("handles empty results gracefully", () => {
    const baseline = makeBaseline(100, 150);
    const result = detectRegression([], baseline, config);
    expect(result.isRegression).toBe(false);
    expect(result.currentAvg).toBe(0);
  });
});
