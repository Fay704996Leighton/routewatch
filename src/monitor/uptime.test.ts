import { describe, it, expect } from "vitest";
import {
  computeUptimeEntry,
  buildUptimeReport,
  formatUptimeReport,
  uptimeToJson,
} from "./uptime";
import { HealthReport } from "./health";

function makeHealthReport(overrides: Partial<HealthReport> = {}): HealthReport {
  return {
    generatedAt: "2024-01-01T00:00:00.000Z",
    overallStatus: "healthy",
    entries: [
      {
        route: "/api/users",
        status: "healthy",
        totalRequests: 10,
        successCount: 10,
        errorCount: 0,
        averageDurationMs: 120,
        p95DurationMs: 200,
      },
      {
        route: "/api/orders",
        status: "degraded",
        totalRequests: 8,
        successCount: 6,
        errorCount: 2,
        averageDurationMs: 300,
        p95DurationMs: 500,
      },
    ],
    ...overrides,
  };
}

describe("computeUptimeEntry", () => {
  it("calculates uptime percent correctly", () => {
    const entry = computeUptimeEntry("/api/test", 20, 18, "healthy");
    expect(entry.uptimePercent).toBe(90);
    expect(entry.route).toBe("/api/test");
  });

  it("returns 100% when totalChecks is 0", () => {
    const entry = computeUptimeEntry("/api/test", 0, 0, "healthy");
    expect(entry.uptimePercent).toBe(100);
  });
});

describe("buildUptimeReport", () => {
  it("builds entries from health report", () => {
    const report = buildUptimeReport(makeHealthReport());
    expect(report.entries).toHaveLength(2);
    expect(report.entries[0].route).toBe("/api/users");
    expect(report.entries[0].uptimePercent).toBe(100);
    expect(report.entries[1].uptimePercent).toBe(75);
  });

  it("computes overall uptime percent", () => {
    const report = buildUptimeReport(makeHealthReport());
    // 16 success / 18 total
    expect(report.overallUptimePercent).toBe(88.89);
  });

  it("returns 100% overall when no checks", () => {
    const report = buildUptimeReport({ ...makeHealthReport(), entries: [] });
    expect(report.overallUptimePercent).toBe(100);
  });
});

describe("formatUptimeReport", () => {
  it("includes route and uptime percent", () => {
    const report = buildUptimeReport(makeHealthReport());
    const text = formatUptimeReport(report);
    expect(text).toContain("/api/users");
    expect(text).toContain("100%");
    expect(text).toContain("75%");
  });
});

describe("uptimeToJson", () => {
  it("serializes to valid JSON", () => {
    const report = buildUptimeReport(makeHealthReport());
    const json = JSON.parse(uptimeToJson(report));
    expect(json.entries).toHaveLength(2);
    expect(json.overallUptimePercent).toBeDefined();
  });
});
