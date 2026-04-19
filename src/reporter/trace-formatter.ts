import { TraceReport, TraceEntry } from "../monitor/trace";

export function formatTraceEntry(entry: TraceEntry): string {
  const hopLines = entry.hops
    .map((h) => `    ${h.label}: +${h.elapsed}ms`)
    .join("\n");
  return [
    `URL:      ${entry.url}`,
    `TraceID:  ${entry.traceId}`,
    `Started:  ${entry.startedAt}`,
    `Duration: ${entry.duration}ms`,
    `Status:   ${entry.statusCode ?? "N/A"}`,
    hopLines ? `Hops:\n${hopLines}` : "Hops:     none",
  ].join("\n");
}

export function formatTraceReportText(report: TraceReport): string {
  const header = `=== Trace Report (${report.generatedAt}) ===${
    report.entries.length === 0 ? "\n  No traces recorded." : ""
  }`;
  const body = report.entries.map(formatTraceEntry).join("\n\n");
  return [header, body].filter(Boolean).join("\n\n");
}

export function traceSummaryLine(report: TraceReport): string {
  const total = report.entries.length;
  const avg =
    total === 0
      ? 0
      : Math.round(
          report.entries.reduce((s, e) => s + e.duration, 0) / total
        );
  return `Traces: ${total}  Avg duration: ${avg}ms`;
}

export function traceReportToJson(report: TraceReport): string {
  return JSON.stringify(report, null, 2);
}
