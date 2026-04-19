import { HealthReport } from "./health";
import { Alert } from "./alert";
import { UptimeReport } from "./uptime";

export interface RollupEntry {
  url: string;
  status: "healthy" | "degraded" | "down";
  uptimePct: number;
  alertCount: number;
  avgDuration: number;
}

export interface RollupReport {
  generatedAt: string;
  entries: RollupEntry[];
  totalHealthy: number;
  totalDegraded: number;
  totalDown: number;
}

export function buildRollupReport(
  health: HealthReport,
  uptime: UptimeReport,
  alerts: Alert[]
): RollupReport {
  const alertsByUrl = new Map<string, number>();
  for (const a of alerts) {
    alertsByUrl.set(a.url, (alertsByUrl.get(a.url) ?? 0) + 1);
  }

  const uptimeByUrl = new Map<string, number>();
  for (const u of uptime.entries) {
    uptimeByUrl.set(u.url, u.uptimePct);
  }

  const entries: RollupEntry[] = health.entries.map((h) => ({
    url: h.url,
    status: h.status,
    uptimePct: uptimeByUrl.get(h.url) ?? 0,
    alertCount: alertsByUrl.get(h.url) ?? 0,
    avgDuration: h.avgDuration,
  }));

  return {
    generatedAt: new Date().toISOString(),
    entries,
    totalHealthy: entries.filter((e) => e.status === "healthy").length,
    totalDegraded: entries.filter((e) => e.status === "degraded").length,
    totalDown: entries.filter((e) => e.status === "down").length,
  };
}

export function rollupToJson(report: RollupReport): string {
  return JSON.stringify(report, null, 2);
}

export function formatRollupReport(report: RollupReport): string {
  const lines: string[] = [
    `Rollup Report — ${report.generatedAt}`,
    `Healthy: ${report.totalHealthy}  Degraded: ${report.totalDegraded}  Down: ${report.totalDown}`,
    "",
  ];
  for (const e of report.entries) {
    lines.push(
      `  [${e.status.toUpperCase()}] ${e.url}  uptime=${e.uptimePct.toFixed(1)}%  alerts=${e.alertCount}  avg=${e.avgDuration}ms`
    );
  }
  return lines.join("\n");
}
