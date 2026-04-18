import { Alert } from "./alert";
import { HealthReport } from "./health";
import { UptimeReport } from "./uptime";
import { TrendReport } from "./trend";

export interface DigestReport {
  generatedAt: string;
  window: string;
  totalEndpoints: number;
  alertCount: number;
  criticalCount: number;
  warnCount: number;
  topDegradedRoutes: string[];
  uptimeSummary: { avg: number; min: number };
  trendSummary: { improving: number; degrading: number; stable: number };
  alerts: Alert[];
}

export function buildDigestReport(
  alerts: Alert[],
  health: HealthReport,
  uptime: UptimeReport,
  trend: TrendReport,
  window = "24h"
): DigestReport {
  const critical = alerts.filter((a) => a.severity === "critical");
  const warn = alerts.filter((a) => a.severity === "warn");

  const uptimeValues = uptime.entries.map((e) => e.uptimePct);
  const avgUptime =
    uptimeValues.length > 0
      ? uptimeValues.reduce((s, v) => s + v, 0) / uptimeValues.length
      : 100;
  const minUptime = uptimeValues.length > 0 ? Math.min(...uptimeValues) : 100;

  const trendCounts = { improving: 0, degrading: 0, stable: 0 };
  for (const entry of trend.entries) {
    trendCounts[entry.classification]++;
  }

  const degraded = trend.entries
    .filter((e) => e.classification === "degrading")
    .sort((a, b) => b.slope - a.slope)
    .slice(0, 5)
    .map((e) => e.url);

  return {
    generatedAt: new Date().toISOString(),
    window,
    totalEndpoints: health.results.length,
    alertCount: alerts.length,
    criticalCount: critical.length,
    warnCount: warn.length,
    topDegradedRoutes: degraded,
    uptimeSummary: { avg: parseFloat(avgUptime.toFixed(2)), min: parseFloat(minUptime.toFixed(2)) },
    trendSummary: trendCounts,
    alerts,
  };
}
