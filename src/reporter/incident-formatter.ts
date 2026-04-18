import { Incident, IncidentReport } from "../monitor/incident";

function severityLabel(s: string): string {
  const map: Record<string, string> = {
    critical: "🔴 CRITICAL",
    high: "🟠 HIGH",
    medium: "🟡 MEDIUM",
    low: "🟢 LOW",
  };
  return map[s] ?? s.toUpperCase();
}

export function formatIncidentEntry(incident: Incident): string {
  const status = incident.resolvedAt ? "RESOLVED" : "OPEN";
  const opened = new Date(incident.openedAt).toISOString();
  const resolved = incident.resolvedAt
    ? new Date(incident.resolvedAt).toISOString()
    : "—";
  return [
    `  [${status}] ${severityLabel(incident.severity)}`,
    `  URL     : ${incident.url}`,
    `  Opened  : ${opened}`,
    `  Resolved: ${resolved}`,
    `  Alerts  : ${incident.alertCount}`,
    `  Summary : ${incident.summary}`,
  ].join("\n");
}

export function formatIncidentReport(report: IncidentReport): string {
  const lines: string[] = [
    "=== Incident Report ===",
    `Total: ${report.total}  Open: ${report.open}  Resolved: ${report.resolved}`,
    "",
  ];
  for (const incident of report.incidents) {
    lines.push(formatIncidentEntry(incident));
    lines.push("");
  }
  return lines.join("\n").trimEnd();
}

export function incidentReportToJson(report: IncidentReport): string {
  return JSON.stringify(report, null, 2);
}
