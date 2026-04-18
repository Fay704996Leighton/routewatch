import type { StaleReport, StaleEntry } from "../monitor/stale";

export function formatStaleEntry(entry: StaleEntry): string {
  const status = entry.isStale ? "STALE" : "ok";
  const age = (entry.staleSinceMs / 1000).toFixed(1);
  return `[${status}] ${entry.url}  age=${age}s  lastSeen=${new Date(entry.lastSeenAt).toISOString()}`;
}

export function formatStaleReportText(report: StaleReport): string {
  const lines: string[] = [
    `=== Stale Route Report ==`,
    `Generated : ${report.generatedAt}`,
    `Stale     : ${report.staleCount} / ${report.entries.length}`,
    "",
  ];
  for (const e of report.entries) {
    lines.push("  " + formatStaleEntry(e));
  }
  return lines.join("\n");
}

export function staleSummaryLine(report: StaleReport): string {
  return `stale-routes: ${report.staleCount} stale of ${report.entries.length} total at ${report.generatedAt}`;
}

export function staleReportToJson(report: StaleReport): string {
  return JSON.stringify(report, null, 2);
}
