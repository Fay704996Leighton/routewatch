import { detectAnomalies, computeZScore, computeStddev } from "./anomaly";
import { PollResult } from "./types";
import { HistoryEntry } from "./history";

function makePollResult(url: string, duration: number): PollResult {
  return { url, method: "GET", status: "success", duration, statusCode: 200, body: "{}", timestamp: Date.now() };
}

function makeHistoryEntry(url: string, duration: number): HistoryEntry {
  return { url, method: "GET", duration, statusCode: 200, status: "success", timestamp: Date.now() };
}

describe("computeStddev", () => {
  it("returns 0 for single value", () => {
    expect(computeStddev([5], 5)).toBe(0);
  });

  it("computes stddev for known values", () => {
    const values = [2, 4, 4, 4, 5, 5, 7, 9];
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const result = computeStddev(values, mean);
    expect(result).toBeCloseTo(2.0, 1);
  });
});

describe("computeZScore", () => {
  it("returns 0 when stddev is 0", () => {
    expect(computeZScore(5, 5, 0)).toBe(0);
  });

  it("returns correct z-score", () => {
    expect(computeZScore(10, 5, 2.5)).toBeCloseTo(2.0);
  });
});

describe("detectAnomalies", () => {
  it("returns empty when insufficient history", () => {
    const results = [makePollResult("http://a.com", 500)];
    const history = [makeHistoryEntry("http://a.com", 100)];
    expect(detectAnomalies(results, history)).toHaveLength(0);
  });

  it("detects anomaly when z-score exceeds threshold", () => {
    const url = "http://api.com";
    const history = [100, 110, 105, 108, 102].map((d) => makeHistoryEntry(url, d));
    const results = [makePollResult(url, 900)];
    const anomalies = detectAnomalies(results, history, 2.5);
    expect(anomalies).toHaveLength(1);
    expect(anomalies[0].isAnomaly).toBe(true);
  });

  it("does not flag normal response", () => {
    const url = "http://api.com";
    const history = [100, 110, 105, 108, 102].map((d) => makeHistoryEntry(url, d));
    const results = [makePollResult(url, 106)];
    const anomalies = detectAnomalies(results, history, 2.5);
    expect(anomalies[0].isAnomaly).toBe(false);
  });

  it("skips error results", () => {
    const result: PollResult = { url: "http://x.com", method: "GET", status: "error", timestamp: Date.now() };
    expect(detectAnomalies([result], [])).toHaveLength(0);
  });
});
