import { Alert } from "./alert";

export type IncidentSeverity = "low" | "medium" | "high" | "critical";

export interface Incident {
  id: string;
  url: string;
  severity: IncidentSeverity;
  openedAt: number;
  resolvedAt?: number;
  alertCount: number;
  summary: string;
}

export interface IncidentReport {
  total: number;
  open: number;
  resolved: number;
  incidents: Incident[];
}

function severityFromAlert(alert: Alert): IncidentSeverity {
  if (alert.severity === "critical") return "critical";
  if (alert.severity === "high") return "high";
  if (alert.severity === "medium") return "medium";
  return "low";
}

export function buildIncident(alerts: Alert[], now = Date.now()): Incident {
  if (alerts.length === 0) throw new Error("alerts must not be empty");
  const first = alerts[0];
  const severity = severityFromAlert(
    alerts.reduce((a, b) =>
      ["critical", "high", "medium", "low"].indexOf(a.severity) <=
      ["critical", "high", "medium", "low"].indexOf(b.severity)
        ? a
        : b
    )
  );
  return {
    id: `${first.url}-${now}`,
    url: first.url,
    severity,
    openedAt: now,
    alertCount: alerts.length,
    summary: `${alerts.length} alert(s) for ${first.url}`,
  };
}

export function buildIncidentReport(incidents: Incident[]): IncidentReport {
  const open = incidents.filter((i) => !i.resolvedAt).length;
  return {
    total: incidents.length,
    open,
    resolved: incidents.length - open,
    incidents,
  };
}

export function resolveIncident(incident: Incident, now = Date.now()): Incident {
  return { ...incident, resolvedAt: now };
}

export function incidentToJson(report: IncidentReport): string {
  return JSON.stringify(report, null, 2);
}
