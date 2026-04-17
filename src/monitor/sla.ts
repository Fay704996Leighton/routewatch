import { HealthReport } from "./health";

export interface SlaConfig {
  targetUptimePercent: number; // e.g. 99.9
  maxAvgResponseMs: number;
  maxErrorRatePercent: number;
}

export interface SlaResult {
  route: string;
  uptimePercent: number;
  avgResponseMs: number;
  errorRatePercent: number;
  breached: boolean;
  violations: string[];
}

export interface SlaReport {
  config: SlaConfig;
  results: SlaResult[];
  totalBreaches: number;
  generatedAt: string;
}

export function evaluateSla(report: HealthReport, config: SlaConfig): SlaReport {
  const results: SlaResult[] = report.entries.map((entry) => {
    const violations: string[] = [];

    const uptimePercent =
      entry.total > 0 ? (entry.up / entry.total) * 100 : 0;
    const errorRatePercent =
      entry.total > 0 ? (entry.errors / entry.total) * 100 : 0;
    const avgResponseMs = entry.avgDurationMs ?? 0;

    if (uptimePercent < config.targetUptimePercent)
      violations.push(
        `uptime ${uptimePercent.toFixed(2)}% < target ${config.targetUptimePercent}%`
      );
    if (avgResponseMs > config.maxAvgResponseMs)
      violations.push(
        `avg response ${avgResponseMs}ms > max ${config.maxAvgResponseMs}ms`
      );
    if (errorRatePercent > config.maxErrorRatePercent)
      violations.push(
        `error rate ${errorRatePercent.toFixed(2)}% > max ${config.maxErrorRatePercent}%`
      );

    return {
      route: entry.route,
      uptimePercent,
      avgResponseMs,
      errorRatePercent,
      breached: violations.length > 0,
      violations,
    };
  });

  return {
    config,
    results,
    totalBreaches: results.filter((r) => r.breached).length,
    generatedAt: new Date().toISOString(),
  };
}

export function slaToJson(report: SlaReport): string {
  return JSON.stringify(report, null, 2);
}

export function formatSlaReport(report: SlaReport): string {
  const lines: string[] = [
    `SLA Report — ${report.generatedAt}`,
    `Target uptime: ${report.config.targetUptimePercent}%  Max avg response: ${report.config.maxAvgResponseMs}ms  Max error rate: ${report.config.maxErrorRatePercent}%`,
    "",
  ];
  for (const r of report.results) {
    const status = r.breached ? "BREACHED" : "OK";
    lines.push(`[${status}] ${r.route}`);
    if (r.violations.length) r.violations.forEach((v) => lines.push(`  - ${v}`));
  }
  lines.push("");
  lines.push(`Total breaches: ${report.totalBreaches}`);
  return lines.join("\n");
}
