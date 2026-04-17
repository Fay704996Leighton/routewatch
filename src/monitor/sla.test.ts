import { evaluateSla, formatSlaReport, slaToJson, SlaConfig } from "./sla";
import { HealthReport } from "./health";

function makeHealthReport(overrides: Partial<HealthReport["entries"][0]>[] = []): HealthReport {
  const base = { route: "/api/test", up: 95, down: 5, errors: 2, total: 100, avgDurationMs: 120, status: "degraded" as const };
  return {
    entries: overrides.map((o) => ({ ...base, ...o })),
    generatedAt: "2024-01-01T00:00:00.000Z",
  };
}

const defaultConfig: SlaConfig = {
  targetUptimePercent: 99,
  maxAvgResponseMs: 200,
  maxErrorRatePercent: 1,
};

describe("evaluateSla", () => {
  it("reports no breach when all metrics are within target", () => {
    const report = makeHealthReport([{ up: 100, down: 0, errors: 0, total: 100, avgDurationMs: 100 }]);
    const result = evaluateSla(report, defaultConfig);
    expect(result.totalBreaches).toBe(0);
    expect(result.results[0].breached).toBe(false);
  });

  it("detects uptime breach", () => {
    const report = makeHealthReport([{ up: 90, down: 10, errors: 0, total: 100, avgDurationMs: 100 }]);
    const result = evaluateSla(report, defaultConfig);
    expect(result.results[0].breached).toBe(true);
    expect(result.results[0].violations.some((v) => v.includes("uptime"))).toBe(true);
  });

  it("detects avg response breach", () => {
    const report = makeHealthReport([{ up: 100, down: 0, errors: 0, total: 100, avgDurationMs: 300 }]);
    const result = evaluateSla(report, defaultConfig);
    expect(result.results[0].violations.some((v) => v.includes("avg response"))).toBe(true);
  });

  it("detects error rate breach", () => {
    const report = makeHealthReport([{ up: 95, down: 5, errors: 5, total: 100, avgDurationMs: 100 }]);
    const result = evaluateSla(report, defaultConfig);
    expect(result.results[0].violations.some((v) => v.includes("error rate"))).toBe(true);
  });

  it("counts totalBreaches correctly", () => {
    const report = makeHealthReport([
      { route: "/a", up: 100, down: 0, errors: 0, total: 100, avgDurationMs: 100 },
      { route: "/b", up: 80, down: 20, errors: 0, total: 100, avgDurationMs: 100 },
    ]);
    const result = evaluateSla(report, defaultConfig);
    expect(result.totalBreaches).toBe(1);
  });
});

describe("formatSlaReport", () => {
  it("includes BREACHED for violations", () => {
    const report = makeHealthReport([{ up: 80, down: 20, errors: 0, total: 100, avgDurationMs: 100 }]);
    const sla = evaluateSla(report, defaultConfig);
    const text = formatSlaReport(sla);
    expect(text).toContain("BREACHED");
  });

  it("includes OK for passing routes", () => {
    const report = makeHealthReport([{ up: 100, down: 0, errors: 0, total: 100, avgDurationMs: 100 }]);
    const sla = evaluateSla(report, defaultConfig);
    const text = formatSlaReport(sla);
    expect(text).toContain("OK");
  });
});

describe("slaToJson", () => {
  it("returns valid JSON", () => {
    const report = makeHealthReport([{ up: 100, down: 0, errors: 0, total: 100, avgDurationMs: 100 }]);
    const sla = evaluateSla(report, defaultConfig);
    expect(() => JSON.parse(slaToJson(sla))).not.toThrow();
  });
});
