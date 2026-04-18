import { Alert } from "./alert";

export type ChangelogSeverity = "info" | "warning" | "critical";

export interface ChangelogEntry {
  timestamp: string;
  url: string;
  severity: ChangelogSeverity;
  message: string;
  tag?: string;
}

export interface ChangelogReport {
  generatedAt: string;
  entries: ChangelogEntry[];
}

export function severityFromAlert(alert: Alert): ChangelogSeverity {
  if (alert.severity === "critical") return "critical";
  if (alert.severity === "warning") return "warning";
  return "info";
}

export function buildChangelogEntry(alert: Alert): ChangelogEntry {
  return {
    timestamp: new Date().toISOString(),
    url: alert.url,
    severity: severityFromAlert(alert),
    message: alert.message,
    tag: alert.tag,
  };
}

export function buildChangelogReport(alerts: Alert[]): ChangelogReport {
  return {
    generatedAt: new Date().toISOString(),
    entries: alerts.map(buildChangelogEntry),
  };
}

export function changelogToJson(report: ChangelogReport): string {
  return JSON.stringify(report, null, 2);
}

export function formatChangelogReport(report: ChangelogReport): string {
  if (report.entries.length === 0) return "Changelog: no entries.\n";
  const lines = [`Changelog (${report.generatedAt}):`];
  for (const e of report.entries) {
    const tag = e.tag ? ` [${e.tag}]` : "";
    lines.push(`  [${e.severity.toUpperCase()}]${tag} ${e.url} — ${e.message}`);
  }
  return lines.join("\n") + "\n";
}
