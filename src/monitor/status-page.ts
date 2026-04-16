import { HealthReport } from "./health";
import { Alert } from "./alert";
import { RegressionResult } from "./regression";

export interface StatusPage {
  generatedAt: string;
  overallStatus: "ok" | "degraded" | "down";
  healthReport: HealthReport;
  activeAlerts: Alert[];
  regressions: RegressionResult[];
}

export function buildStatusPage(
  healthReport: HealthReport,
  activeAlerts: Alert[],
  regressions: RegressionResult[]
): StatusPage {
  const overallStatus = deriveOverallStatus(healthReport, activeAlerts);
  return {
    generatedAt: new Date().toISOString(),
    overallStatus,
    healthReport,
    activeAlerts,
    regressions,
  };
}

function deriveOverallStatus(
  healthReport: HealthReport,
  alerts: Alert[]
): "ok" | "degraded" | "down" {
  const hasCritical = alerts.some((a) => a.severity === "critical");
  if (hasCritical) return "down";
  const hasWarning = alerts.some((a) => a.severity === "warning");
  if (hasWarning) return "degraded";
  const hasUnhealthy = healthReport.entries.some(
    (e) => e.status === "unhealthy"
  );
  if (hasUnhealthy) return "degraded";
  return "ok";
}

export function statusPageToJson(page: StatusPage): string {
  return JSON.stringify(page, null, 2);
}

export function formatStatusPage(page: StatusPage): string {
  const lines: string[] = [
    `RouteWatch Status — ${page.generatedAt}`,
    `Overall: ${page.overallStatus.toUpperCase()}`,
    "",
    `Health: ${page.healthReport.summary.healthy} healthy, ${page.healthReport.summary.unhealthy} unhealthy`,
    `Active Alerts: ${page.activeAlerts.length}`,
    `Regressions: ${page.regressions.length}`,
  ];
  if (page.activeAlerts.length > 0) {
    lines.push("", "Alerts:");
    for (const a of page.activeAlerts) {
      lines.push(`  [${a.severity.toUpperCase()}] ${a.message}`);
    }
  }
  return lines.join("\n");
}
