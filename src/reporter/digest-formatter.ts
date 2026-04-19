import { DigestReport } from "../monitor/digest";

/**
 * Formats a single DigestReport into a human-readable summary string.
 */
export function formatDigestEntry(report: DigestReport): string {
  const lines: string[] = [];
  lines.push(`=== RouteWatch Digest (${report.window}) ===`);
  lines.push(`Generated: ${report.generatedAt}`);
  lines.push(`Endpoints monitored : ${report.totalEndpoints}`);
  lines.push(`Alerts total        : ${report.alertCount} (critical: ${report.criticalCount}, warn: ${report.warnCount})`);
  lines.push(`Uptime avg/min      : ${report.uptimeSummary.avg}% / ${report.uptimeSummary.min}%`);
  lines.push(
    `Trends              : ${report.trendSummary.improving} improving, ` +
      `${report.trendSummary.degrading} degrading, ${report.trendSummary.stable} stable`
  );
  if (report.topDegradedRoutes.length > 0) {
    lines.push(`Top degraded routes:`);
    for (const r of report.topDegradedRoutes) lines.push(`  - ${r}`);
  }
  return lines.join("\n");
}

/**
 * Formats a DigestReport into a human-readable string with a trailing newline.
 */
export function formatDigestReport(report: DigestReport): string {
  return formatDigestEntry(report) + "\n";
}

/**
 * Serializes a DigestReport to a pretty-printed JSON string.
 */
export function digestToJson(report: DigestReport): string {
  return JSON.stringify(report, null, 2);
}

/**
 * Formats multiple DigestReports into a single combined summary string,
 * separating each entry with a blank line.
 */
export function formatDigestReports(reports: DigestReport[]): string {
  if (reports.length === 0) return "";
  return reports.map(formatDigestEntry).join("\n\n") + "\n";
}
