import { Alert } from "../monitor/alert";

const SEVERITY_ICON: Record<string, string> = {
  critical: "🔴",
  warn: "🟡",
};

const TYPE_LABEL: Record<string, string> = {
  regression: "Response Time Regression",
  "schema-drift": "Schema Drift",
};

export function formatAlertEntry(alert: Alert): string {
  const icon = SEVERITY_ICON[alert.severity] ?? "⚪";
  const label = TYPE_LABEL[alert.type] ?? alert.type;
  return `${icon} [${alert.severity.toUpperCase()}] ${label} — ${alert.endpoint}\n   ${alert.message}\n   At: ${alert.timestamp}`;
}

export function formatAlertReport(alerts: Alert[]): string {
  if (alerts.length === 0) {
    return "✅ No alerts — all endpoints within thresholds.";
  }

  const criticalCount = alerts.filter((a) => a.severity === "critical").length;
  const warnCount = alerts.filter((a) => a.severity === "warn").length;

  const header = [
    "=== RouteWatch Alert Report ===",
    `Total: ${alerts.length} alert(s) | Critical: ${criticalCount} | Warn: ${warnCount}`,
    "",
  ].join("\n");

  const body = alerts.map(formatAlertEntry).join("\n\n");

  return `${header}${body}`;
}

export function alertsToJson(alerts: Alert[]): string {
  return JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      totalAlerts: alerts.length,
      criticalCount: alerts.filter((a) => a.severity === "critical").length,
      warnCount: alerts.filter((a) => a.severity === "warn").length,
      alerts,
    },
    null,
    2
  );
}
