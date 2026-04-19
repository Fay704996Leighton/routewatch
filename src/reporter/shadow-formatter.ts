import { ShadowEntry, ShadowReport } from "../monitor/shadow";

export function formatShadowEntry(entry: ShadowEntry): string {
  const sign = entry.delta >= 0 ? "+" : "";
  return [
    `url:          ${entry.url}`,
    `primary:      ${entry.primary}ms`,
    `shadow:       ${entry.shadow}ms`,
    `delta:        ${sign}${entry.delta}ms (${sign}${entry.deltaPercent}%)`,
    `timestamp:    ${entry.timestamp}`,
  ].join("\n");
}

export function formatShadowReportText(report: ShadowReport): string {
  if (report.entries.length === 0) {
    return "Shadow Report: no comparisons recorded.";
  }
  const sections = report.entries.map(formatShadowEntry);
  const summary = `Total: ${report.totalCompared}  Avg delta: ${report.avgDelta}ms  Max delta: ${report.maxDelta}ms`;
  return ["=== Shadow Comparison ===", "", ...sections, "", summary].join("\n");
}

export function shadowSummaryLine(report: ShadowReport): string {
  return `shadow: ${report.totalCompared} compared, avg delta ${report.avgDelta}ms, max ${report.maxDelta}ms`;
}

export function shadowReportToJson(report: ShadowReport): string {
  return JSON.stringify(report, null, 2);
}
