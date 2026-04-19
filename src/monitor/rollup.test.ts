import { buildRollupReport, formatRollupReport, rollupToJson } from "./rollup";
import { HealthReport } from "./health";
import { UptimeReport } from "./uptime";
import { Alert } from "./alert";

function makeHealth(): HealthReport {
  return {
    generatedAt: "2024-01-01T00:00:00.000Z",
    entries: [
      { url: "https://api.example.com/a", status: "healthy", avgDuration: 120, successRate: 1, totalChecks: 10 },
      { url: "https://api.example.com/b", status: "degraded", avgDuration: 800, successRate: 0.8, totalChecks: 10 },
      { url: "https://api.example.com/c", status: "down", avgDuration: 0, successRate: 0, totalChecks: 10 },
    ],
  } as HealthReport;
}

function makeUptime(): UptimeReport {
  return {
    generatedAt: "2024-01-01T00:00:00.000Z",
    entries: [
      { url: "https://api.example.com/a", uptimePct: 99.9, totalChecks: 10, successChecks: 10 },
      { url: "https://api.example.com/b", uptimePct: 80.0, totalChecks: 10, successChecks: 8 },
      { url: "https://api.example.com/c", uptimePct: 0.0, totalChecks: 10, successChecks: 0 },
    ],
  } as UptimeReport;
}

function makeAlerts(): Alert[] {
  return [
    { url: "https://api.example.com/b", severity: "warning", message: "slow", type: "regression" },
    { url: "https://api.example.com/b", severity: "warning", message: "drift", type: "schema" },
    { url: "https://api.example.com/c", severity: "critical", message: "down", type: "regression" },
  ] as Alert[];
}

describe("buildRollupReport", () => {
  it("aggregates health, uptime, and alert counts", () => {
    const report = buildRollupReport(makeHealth(), makeUptime(), makeAlerts());
    expect(report.totalHealthy).toBe(1);
    expect(report.totalDegraded).toBe(1);
    expect(report.totalDown).toBe(1);
    const b = report.entries.find((e) => e.url.endsWith("/b"))!;
    expect(b.alertCount).toBe(2);
    expect(b.uptimePct).toBeCloseTo(80.0);
    const a = report.entries.find((e) => e.url.endsWith("/a"))!;
    expect(a.alertCount).toBe(0);
    expect(a.uptimePct).toBeCloseTo(99.9);
  });

  it("defaults uptimePct and alertCount to 0 when missing", () => {
    const report = buildRollupReport(makeHealth(), { generatedAt: "", entries: [] } as any, []);
    for (const e of report.entries) {
      expect(e.uptimePct).toBe(0);
      expect(e.alertCount).toBe(0);
    }
  });
});

describe("formatRollupReport", () => {
  it("includes status and url", () => {
    const report = buildRollupReport(makeHealth(), makeUptime(), makeAlerts());
    const text = formatRollupReport(report);
    expect(text).toContain("HEALTHY");
    expect(text).toContain("DEGRADED");
    expect(text).toContain("DOWN");
    expect(text).toContain("api.example.com/b");
  });
});

describe("rollupToJson", () => {
  it("returns valid JSON", () => {
    const report = buildRollupReport(makeHealth(), makeUptime(), makeAlerts());
    const json = JSON.parse(rollupToJson(report));
    expect(json.entries).toHaveLength(3);
  });
});
