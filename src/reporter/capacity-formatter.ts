import type { CapacityReport, CapacityEntry } from '../monitor/capacity';

export function formatCapacityEntry(e: CapacityEntry): string {
  const statusLabel = e.status.toUpperCase().padEnd(8);
  return [
    `[${statusLabel}] ${e.url}`,
    `  avg: ${e.avgDuration.toFixed(1)}ms | p95: ${e.p95Duration.toFixed(1)}ms`,
    `  rpm: ${e.requestsPerMinute} / ${e.estimatedMaxRpm} max (${e.utilizationPct}% utilization)`,
  ].join('\n');
}

export function formatCapacityReportText(report: CapacityReport): string {
  const header = `=== Capacity Report [${report.generatedAt}] ===`;
  if (report.entries.length === 0) {
    return `${header}\n  No entries.`;
  }
  const body = report.entries.map(formatCapacityEntry).join('\n\n');
  return `${header}\n\n${body}`;
}

export function capacitySummaryLine(report: CapacityReport): string {
  const critical = report.entries.filter(e => e.status === 'critical').length;
  const warning = report.entries.filter(e => e.status === 'warning').length;
  const total = report.entries.length;
  return `Capacity: ${total} routes | ${critical} critical | ${warning} warning`;
}

export function capacityReportToJson(report: CapacityReport): string {
  return JSON.stringify(report, null, 2);
}
