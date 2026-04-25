import { BurstReport, BurstEntry } from '../monitor/burst';

export function formatBurstEntry(entry: BurstEntry): string {
  const status = entry.isBurst ? '[BURST]' : '[ok]   ';
  const rate = (entry.failureRate * 100).toFixed(1);
  return (
    `${status} ${entry.url}\n` +
    `         failures: ${entry.failedRequests}/${entry.totalRequests} (${rate}%)  ` +
    `window: ${entry.windowMs}ms  detected: ${entry.detectedAt}`
  );
}

export function formatBurstReportText(report: BurstReport): string {
  const bursting = report.entries.filter(e => e.isBurst);
  const lines: string[] = [
    `=== Burst Report ===`,
    `Generated : ${report.generatedAt}`,
    `Window    : ${report.windowMs}ms`,
    `Threshold : ${(report.threshold * 100).toFixed(0)}%`,
    `Endpoints : ${report.entries.length} (${bursting.length} bursting)`,
    '',
  ];
  for (const entry of report.entries) {
    lines.push(formatBurstEntry(entry));
  }
  return lines.join('\n');
}

export function burstSummaryLine(report: BurstReport): string {
  const bursting = report.entries.filter(e => e.isBurst).length;
  const total = report.entries.length;
  return `Burst: ${bursting}/${total} endpoints in burst state (window=${report.windowMs}ms, threshold=${(report.threshold * 100).toFixed(0)}%)`;
}

export function burstReportToJson(report: BurstReport): string {
  return JSON.stringify(report, null, 2);
}
