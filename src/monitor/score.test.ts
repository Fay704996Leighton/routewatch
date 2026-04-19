import { buildScoreReport, gradeFromScore, formatScoreReport } from "./score";
import type { HealthReport } from "./health";
import type { UptimeReport } from "./uptime";
import type { BudgetReport } from "./budget";
import type { AnomalyReport } from "./anomaly";

function makeHealthReport(url: string, status: "healthy" | "degraded" | "down"): HealthReport {
  return {
    generatedAt: new Date().toISOString(),
    entries: [{ url, status, successRate: status === "healthy" ? 1 : 0.5, avgDuration: 200, totalChecks: 10, failedChecks: 0 }],
    summary: { healthy: 1, degraded: 0, down: 0 },
  };
}

function makeUptimeReport(url: string, uptimePercent: number): UptimeReport {
  return {
    generatedAt: new Date().toISOString(),
    entries: [{ url, uptimePercent, totalChecks: 100, successChecks: uptimePercent, downtimeMinutes: 0 }],
  };
}

function makeBudgetReport(url: string, withinBudget: boolean, p95 = 300): BudgetReport {
  return {
    generatedAt: new Date().toISOString(),
    entries: [{ url, withinBudget, p50: 200, p95, p99: 400, budget: 500, breaches: withinBudget ? 0 : 5 }],
  };
}

function makeAnomalyReport(anomalyUrls: string[]): AnomalyReport {
  return {
    generatedAt: new Date().toISOString(),
    anomalies: anomalyUrls.map((url) => ({ url, zScore: 3.5, duration: 900, mean: 300, stddev: 100 })),
  };
}

describe("gradeFromScore", () => {
  it("returns A for 90+", () => expect(gradeFromScore(95)).toBe("A"));
  it("returns B for 75–89", () => expect(gradeFromScore(80)).toBe("B"));
  it("returns C for 60–74", () => expect(gradeFromScore(65)).toBe("C"));
  it("returns D for 45–59", () => expect(gradeFromScore(50)).toBe("D"));
  it("returns F below 45", () => expect(gradeFromScore(30)).toBe("F"));
});

describe("buildScoreReport", () => {
  const url = "https://api.example.com/health";

  it("produces a score entry for a healthy route", () => {
    const report = buildScoreReport(
      makeHealthReport(url, "healthy"),
      makeUptimeReport(url, 99),
      makeBudgetReport(url, true),
      makeAnomalyReport([])
    );
    expect(report.entries).toHaveLength(1);
    expect(report.entries[0].score).toBeGreaterThan(80);
    expect(report.entries[0].grade).toBe("A");
  });

  it("penalises anomalies", () => {
    const good = buildScoreReport(
      makeHealthReport(url, "healthy"),
      makeUptimeReport(url, 99),
      makeBudgetReport(url, true),
      makeAnomalyReport([])
    );
    const bad = buildScoreReport(
      makeHealthReport(url, "healthy"),
      makeUptimeReport(url, 99),
      makeBudgetReport(url, true),
      makeAnomalyReport([url, url, url])
    );
    expect(bad.entries[0].score).toBeLessThan(good.entries[0].score);
  });

  it("computes overall as average of entries", () => {
    const report = buildScoreReport(
      makeHealthReport(url, "down"),
      makeUptimeReport(url, 50),
      makeBudgetReport(url, false, 900),
      makeAnomalyReport([url, url])
    );
    expect(report.overall).toBe(report.entries[0].score);
  });

  it("formats report as text", () => {
    const report = buildScoreReport(
      makeHealthReport(url, "healthy"),
      makeUptimeReport(url, 100),
      makeBudgetReport(url, true),
      makeAnomalyReport([])
    );
    const text = formatScoreReport(report);
    expect(text).toContain(url);
    expect(text).toContain("Overall Score");
  });
});
