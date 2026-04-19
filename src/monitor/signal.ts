import { Alert } from "./alert";

export type SignalLevel = "none" | "low" | "medium" | "high" | "critical";

export interface SignalEntry {
  url: string;
  alertCount: number;
  maxSeverity: string;
  level: SignalLevel;
  score: number;
}

export interface SignalReport {
  generatedAt: string;
  entries: SignalEntry[];
  overallLevel: SignalLevel;
}

const SEVERITY_WEIGHT: Record<string, number> = {
  info: 1,
  warning: 2,
  critical: 4,
};

function levelFromScore(score: number): SignalLevel {
  if (score === 0) return "none";
  if (score <= 2) return "low";
  if (score <= 5) return "medium";
  if (score <= 10) return "high";
  return "critical";
}

export function buildSignalReport(alerts: Alert[]): SignalReport {
  const grouped = new Map<string, Alert[]>();
  for (const alert of alerts) {
    const list = grouped.get(alert.url) ?? [];
    list.push(alert);
    grouped.set(alert.url, list);
  }

  const entries: SignalEntry[] = [];
  for (const [url, group] of grouped) {
    const score = group.reduce((sum, a) => sum + (SEVERITY_WEIGHT[a.severity] ?? 1), 0);
    const maxSeverity = group.reduce((max, a) =>
      (SEVERITY_WEIGHT[a.severity] ?? 1) > (SEVERITY_WEIGHT[max] ?? 1) ? a.severity : max,
      "info"
    );
    entries.push({ url, alertCount: group.length, maxSeverity, level: levelFromScore(score), score });
  }

  entries.sort((a, b) => b.score - a.score);

  const overallScore = entries.reduce((sum, e) => sum + e.score, 0);
  return {
    generatedAt: new Date().toISOString(),
    entries,
    overallLevel: levelFromScore(overallScore),
  };
}

export function signalToJson(report: SignalReport): string {
  return JSON.stringify(report, null, 2);
}

export function formatSignalReport(report: SignalReport): string {
  const lines: string[] = [
    `Signal Report — ${report.generatedAt}`,
    `Overall Level: ${report.overallLevel.toUpperCase()}`,
    "",
  ];
  for (const e of report.entries) {
    lines.push(`  ${e.url}`);
    lines.push(`    alerts=${e.alertCount}  max_severity=${e.maxSeverity}  level=${e.level}  score=${e.score}`);
  }
  if (report.entries.length === 0) lines.push("  No signals detected.");
  return lines.join("\n");
}
