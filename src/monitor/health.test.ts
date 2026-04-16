import { buildHealthSummary, buildHealthReport, computeHealthStatus } from "./health";
import { PollResult } from "./types";

function makeResult(status: PollResult["status"], durationMs = 200): PollResult {
  return { url: "http://example.com", status, durationMs, timestamp: Date.now() } as PollResult;
}

describe("computeHealthStatus", () => {
  it("returns healthy for >= 95% success", () => {
    expect(computeHealthStatus(1.0)).toBe("healthy");
    expect(computeHealthStatus(0.95)).toBe("healthy");
  });

  it("returns degraded for 50-94%", () => {
    expect(computeHealthStatus(0.94)).toBe("degraded");
    expect(computeHealthStatus(0.5)).toBe("degraded");
  });

  it("returns down for < 50%", () => {
    expect(computeHealthStatus(0.49)).toBe("down");
    expect(computeHealthStatus(0)).toBe("down");
  });
});

describe("buildHealthSummary", () => {
  const url = "http://example.com";

  it("handles empty results", () => {
    const s = buildHealthSummary(url, []);
    expect(s.status).toBe("down");
    expect(s.totalChecks).toBe(0);
  });

  it("computes correct success rate", () => {
    const results = [
      makeResult("success"),
      makeResult("success"),
      makeResult("error"),
      makeResult("success"),
      makeResult("success"),
    ];
    const s = buildHealthSummary(url, results);
    expect(s.successRate).toBeCloseTo(0.8);
    expect(s.failedChecks).toBe(1);
    expect(s.status).toBe("degraded");
  });

  it("computes average duration", () => {
    const results = [makeResult("success", 100), makeResult("success", 300)];
    const s = buildHealthSummary(url, results);
    expect(s.avgDurationMs).toBe(200);
  });

  it("marks all success as healthy", () => {
    const results = Array.from({ length: 10 }, () => makeResult("success"));
    const s = buildHealthSummary(url, results);
    expect(s.status).toBe("healthy");
  });
});

describe("buildHealthReport", () => {
  it("returns one summary per url", () => {
    const grouped = {
      "http://a.com": [makeResult("success")],
      "http://b.com": [makeResult("error")],
    };
    const report = buildHealthReport(grouped);
    expect(report).toHaveLength(2);
    expect(report.map(r => r.url)).toContain("http://a.com");
  });
});
