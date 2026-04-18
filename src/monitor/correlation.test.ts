import { buildCorrelationReport, formatCorrelationReport } from "./correlation";
import { TrendReport } from "./trend";
import { HealthReport } from "./health";

function makeTrend(overrides: Partial<TrendReport> = {}): TrendReport {
  return {
    generatedAt: "2024-01-01T00:00:00.000Z",
    entries: [
      { url: "https://api.example.com/fast", slopeMs: 10, classification: "stable" },
      { url: "https://api.example.com/slow", slopeMs: 1500, classification: "degrading" },
    ],
    ...overrides,
  };
}

function makeHealth(overrides: Partial<HealthReport> = {}): HealthReport {
  return {
    generatedAt: "2024-01-01T00:00:00.000Z",
    entries: [
      { url: "https://api.example.com/fast", total: 100, successes: 99, errors: 1, successRate: 0.99, status: "healthy" },
      { url: "https://api.example.com/slow", total: 100, successes: 60, errors: 40, successRate: 0.60, status: "degraded" },
    ],
    ...overrides,
  };
}

describe("buildCorrelationReport", () => {
  it("returns one entry per trend url", () => {
    const report = buildCorrelationReport(makeTrend(), makeHealth());
    expect(report.entries).toHaveLength(2);
  });

  it("assigns higher score to slow + error-prone endpoint", () => {
    const report = buildCorrelationReport(makeTrend(), makeHealth());
    const slow = report.entries.find((e) => e.url.includes("slow"))!;
    const fast = report.entries.find((e) => e.url.includes("fast"))!;
    expect(slow.score).toBeGreaterThan(fast.score);
  });

  it("marks slow endpoint as high risk", () => {
    const report = buildCorrelationReport(makeTrend(), makeHealth());
    const slow = report.entries.find((e) => e.url.includes("slow"))!;
    expect(slow.risk).toBe("high");
  });

  it("marks fast endpoint as low risk", () => {
    const report = buildCorrelationReport(makeTrend(), makeHealth());
    const fast = report.entries.find((e) => e.url.includes("fast"))!;
    expect(fast.risk).toBe("low");
  });

  it("sorts entries by score descending", () => {
    const report = buildCorrelationReport(makeTrend(), makeHealth());
    const scores = report.entries.map((e) => e.score);
    expect(scores[0]).toBeGreaterThanOrEqual(scores[1]);
  });

  it("handles missing health entry gracefully", () => {
    const health = makeHealth();
    health.entries = [];
    const report = buildCorrelationReport(makeTrend(), health);
    report.entries.forEach((e) => expect(e.errorRate).toBe(0));
  });

  it("includes generatedAt timestamp in report", () => {
    const report = buildCorrelationReport(makeTrend(), makeHealth());
    expect(report.generatedAt).toBeDefined();
    expect(typeof report.generatedAt).toBe("string");
  });
});

describe("formatCorrelationReport", () => {
  it("includes risk labels in output", () => {
    const report = buildCorrelationReport(makeTrend(), makeHealth());
    const text = formatCorrelationReport(report);
    expect(text).toContain("HIGH");
    expect(text).toContain("LOW");
  });

  it("includes endpoint urls in output", () => {
    const report = buildCorrelationReport(makeTrend(), makeHealth());
    const text = formatCorrelationReport(report);
    expect(text).toContain("https://api.example.com/fast");
    expect(text).toContain("https://api.example.com/slow");
  });
});
