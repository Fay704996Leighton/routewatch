import { HistoryEntry } from "../monitor/history";

export interface HistoryReport {
  url: string;
  totalChecks: number;
  successRate: number;
  avgDurationMs: number;
  entries: HistoryEntry[];
}

export function buildHistoryReport(url: string, entries: HistoryEntry[]): HistoryReport {
  const total = entries.length;
  const successes = entries.filter((e) => e.ok).length;
  const avgDuration =
    total === 0 ? 0 : entries.reduce((sum, e) => sum + e.durationMs, 0) / total;
  return {
    url,
    totalChecks: total,
    successRate: total === 0 ? 1 : successes / total,
    avgDurationMs: Math.round(avgDuration),
    entries,
  };
}

export function formatHistoryReport(report: HistoryReport): string {
  const lines: string[] = [];
  lines.push(`History: ${report.url}`);
  lines.push(`  Checks : ${report.totalChecks}`);
  lines.push(`  Success: ${(report.successRate * 100).toFixed(1)}%`);
  lines.push(`  Avg ms : ${report.avgDurationMs}`);
  for (const e of report.entries.slice(-5)) {
    const status = e.ok ? "OK" : "FAIL";
    lines.push(`  [${e.timestamp}] ${status} ${e.durationMs}ms`);
  }
  return lines.join("\n");
}

export function historyToJson(report: HistoryReport): string {
  return JSON.stringify(report, null, 2);
}
