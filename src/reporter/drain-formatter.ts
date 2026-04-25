import { DrainEntry, DrainReport } from "../monitor/drain";

export function formatDrainEntry(entry: DrainEntry): string {
  const status = entry.isDraining
    ? `DRAINING [${entry.severity}]`
    : "stable";
  const trend = entry.avgDurations
    .map((d) => `${d}ms`)
    .join(" → ");
  return [
    `  URL     : ${entry.url}`,
    `  Status  : ${status}`,
    `  Rate    : ${entry.drainRate} ms/window`,
    `  Windows : ${entry.windowCount}`,
    `  Trend   : ${trend}`,
  ].join("\n");
}

export function formatDrainReportText(report: DrainReport): string {
  if (report.entries.length === 0) {
    return `Drain Report — ${report.generatedAt}\nNo endpoints tracked.`;
  }
  const header = [
    `Drain Report — ${report.generatedAt}`,
    `Draining: ${report.drainingCount} / ${report.entries.length}`,
    "",
  ];
  const body = report.entries.map(formatDrainEntry);
  return [...header, ...body].join("\n");
}

export function drainSummaryLine(report: DrainReport): string {
  if (report.drainingCount === 0) {
    return `drain: all ${report.entries.length} endpoint(s) stable`;
  }
  return `drain: ${report.drainingCount}/${report.entries.length} endpoint(s) draining`;
}

export function drainReportToJson(report: DrainReport): string {
  return JSON.stringify(report, null, 2);
}
