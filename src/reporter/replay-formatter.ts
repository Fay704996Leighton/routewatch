import { ReplayReport, ReplayEntry } from "../monitor/replay";

export function formatReplayEntry(e: ReplayEntry): string {
  const label = e.label ? ` [${e.label}]` : "";
  const status = e.status !== null ? `HTTP ${e.status}` : "no-response";
  const result = e.ok ? "✔" : "✘";
  return `${result} ${e.timestamp}${label} | ${e.url} | ${status} | ${e.duration}ms`;
}

export function formatReplayReportText(report: ReplayReport): string {
  const header = [
    `Replay Report`,
    `Total: ${report.total} | Replayed: ${report.replayed} | Skipped: ${report.skipped}`,
    "=".repeat(60),
  ].join("\n");

  if (report.entries.length === 0) {
    return header + "\nNo entries in range.";
  }

  const body = report.entries.map(formatReplayEntry).join("\n");
  return header + "\n" + body;
}

export function replaySummaryLine(report: ReplayReport): string {
  const pct =
    report.total > 0 ? ((report.replayed / report.total) * 100).toFixed(1) : "0.0";
  return `Replayed ${report.replayed}/${report.total} entries (${pct}%)`;
}

export function replayReportToJson(report: ReplayReport): string {
  return JSON.stringify(report, null, 2);
}
