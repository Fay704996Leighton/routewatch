import { RegressionResult } from "../monitor/regression";

export interface RegressionReport {
  checkedAt: string;
  totalChecked: number;
  regressionsFound: number;
  regressions: RegressionResult[];
}

export function formatRegressionReport(report: RegressionReport): string {
  const lines: string[] = [];
  lines.push(`RouteWatch Regression Report — ${report.checkedAt}`);
  lines.push(`Endpoints checked: ${report.totalChecked}`);
  lines.push(`Regressions found: ${report.regressionsFound}`);
  lines.push("");

  if (report.regressionsFound === 0) {
    lines.push("✓ All endpoints within acceptable response time thresholds.");
    return lines.join("\n");
  }

  for (const reg of report.regressions) {
    lines.push(`✗ ${reg.url}`);
    lines.push(
      `  Baseline avg: ${reg.baseline.avgDuration}ms  Current avg: ${reg.currentAvg}ms  (Δ ${reg.avgDeltaPct.toFixed(1)}%)`
    );
    lines.push(
      `  Baseline p95: ${reg.baseline.p95Duration}ms  Current p95: ${reg.currentP95}ms  (Δ ${reg.p95DeltaPct.toFixed(1)}%)`
    );
    for (const reason of reg.reason) {
      lines.push(`  → ${reason}`);
    }
    lines.push("");
  }

  return lines.join("\n");
}

export function buildRegressionReport(
  results: RegressionResult[]
): RegressionReport {
  const regressions = results.filter((r) => r.isRegression);
  return {
    checkedAt: new Date().toISOString(),
    totalChecked: results.length,
    regressionsFound: regressions.length,
    regressions,
  };
}
