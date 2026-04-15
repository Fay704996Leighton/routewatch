import { RegressionResult } from "./regression";
import { SchemaDriftResult } from "./schema-checker";

export type AlertSeverity = "warn" | "critical";

export interface Alert {
  endpoint: string;
  severity: AlertSeverity;
  type: "regression" | "schema-drift";
  message: string;
  timestamp: string;
}

export function buildAlertsFromRegressions(
  regressions: RegressionResult[]
): Alert[] {
  return regressions.map((r) => ({
    endpoint: r.endpoint,
    severity: r.percentChange >= 100 ? "critical" : "warn",
    type: "regression",
    message: `Response time increased by ${r.percentChange.toFixed(1)}% (baseline: ${r.baselineAvg.toFixed(0)}ms, current: ${r.currentAvg.toFixed(0)}ms)`,
    timestamp: new Date().toISOString(),
  }));
}

export function buildAlertsFromSchemaDrift(
  driftResults: SchemaDriftResult[]
): Alert[] {
  return driftResults
    .filter((d) => d.hasDrift)
    .map((d) => ({
      endpoint: d.endpoint,
      severity: "warn" as AlertSeverity,
      type: "schema-drift",
      message: `Schema drift detected — added: [${d.addedKeys.join(", ")}], removed: [${d.removedKeys.join(", ")}]`,
      timestamp: new Date().toISOString(),
    }));
}

export function mergeAlerts(
  regressionAlerts: Alert[],
  driftAlerts: Alert[]
): Alert[] {
  return [...regressionAlerts, ...driftAlerts].sort((a, b) => {
    if (a.severity === "critical" && b.severity !== "critical") return -1;
    if (b.severity === "critical" && a.severity !== "critical") return 1;
    return a.endpoint.localeCompare(b.endpoint);
  });
}
