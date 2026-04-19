import type { MirrorReport, MirrorEntry } from "../monitor/mirror";

export function formatMirrorEntry(e: MirrorEntry): string {
  const statusLabel = e.statusMatch
    ? `${e.primaryStatus}`
    : `${e.primaryStatus}/${e.mirrorStatus}(mismatch)`;
  const bodyLabel = e.bodyMatch ? "body-ok" : "body-drift";
  return `[${e.timestamp}] ${e.url} | status: ${statusLabel} | ${bodyLabel} | Δ${e.durationDeltaMs}ms`;
}

export function formatMirrorReportText(report: MirrorReport): string {
  if (report.entries.length === 0) return "No mirror comparisons recorded.";
  const lines = [
    `Mirror Comparison Report`,
    `Total: ${report.totalCompared} | Diverged: ${report.diverged}`,
    "-".repeat(60),
    ...report.entries.map(formatMirrorEntry),
  ];
  return lines.join("\n");
}

export function mirrorSummaryLine(report: MirrorReport): string {
  const pct =
    report.totalCompared > 0
      ? ((report.diverged / report.totalCompared) * 100).toFixed(1)
      : "0.0";
  return `mirror: ${report.diverged}/${report.totalCompared} diverged (${pct}%)`;
}

export function mirrorReportToJson(report: MirrorReport): string {
  return JSON.stringify(report, null, 2);
}
