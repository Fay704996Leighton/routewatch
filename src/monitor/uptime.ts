import { HealthReport, HealthStatus } from "./health";

export interface UptimeEntry {
  route: string;
  totalChecks: number;
  successChecks: number;
  uptimePercent: number;
  status: HealthStatus;
}

export interface UptimeReport {
  generatedAt: string;
  entries: UptimeEntry[];
  overallUptimePercent: number;
}

export function computeUptimeEntry(
  route: string,
  totalChecks: number,
  successChecks: number,
  status: HealthStatus
): UptimeEntry {
  const uptimePercent =
    totalChecks === 0 ? 100 : Math.round((successChecks / totalChecks) * 10000) / 100;
  return { route, totalChecks, successChecks, uptimePercent, status };
}

export function buildUptimeReport(healthReport: HealthReport): UptimeReport {
  const entries: UptimeEntry[] = healthReport.entries.map((e) => {
    const total = e.totalRequests;
    const success = e.successCount;
    return computeUptimeEntry(e.route, total, success, e.status);
  });

  const totalChecks = entries.reduce((s, e) => s + e.totalChecks, 0);
  const successChecks = entries.reduce((s, e) => s + e.successChecks, 0);
  const overallUptimePercent =
    totalChecks === 0 ? 100 : Math.round((successChecks / totalChecks) * 10000) / 100;

  return {
    generatedAt: new Date().toISOString(),
    entries,
    overallUptimePercent,
  };
}

export function uptimeToJson(report: UptimeReport): string {
  return JSON.stringify(report, null, 2);
}

export function formatUptimeReport(report: UptimeReport): string {
  const lines: string[] = [
    `Uptime Report — ${report.generatedAt}`,
    `Overall Uptime: ${report.overallUptimePercent}%`,
    "",
  ];
  for (const e of report.entries) {
    lines.push(
      `  [${e.status.toUpperCase()}] ${e.route} — ${e.uptimePercent}% (${e.successChecks}/${e.totalChecks})`
    );
  }
  return lines.join("\n");
}
