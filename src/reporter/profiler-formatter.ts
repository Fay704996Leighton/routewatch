import { ProfileEntry, ProfileReport } from '../monitor/profiler';

export function formatProfileEntry(entry: ProfileEntry): string {
  const lines = [
    `  URL:    ${entry.method} ${entry.url}`,
    `  Min:    ${entry.min}ms`,
    `  P50:    ${entry.p50}ms`,
    `  P95:    ${entry.p95}ms`,
    `  P99:    ${entry.p99}ms`,
    `  Max:    ${entry.max}ms`,
    `  Samples: ${entry.sampleCount}`,
  ];
  return lines.join('\n');
}

export function formatProfileReport(report: ProfileReport): string {
  if (report.entries.length === 0) {
    return `RouteWatch Profile Report — ${report.generatedAt}\n\nNo data.`;
  }
  const header = `RouteWatch Profile Report — ${report.generatedAt}`;
  const body = report.entries.map(formatProfileEntry).join('\n\n');
  return `${header}\n\n${body}`;
}

export function profileReportToJson(report: ProfileReport): string {
  return JSON.stringify(report, null, 2);
}
