/**
 * Burst detector: identifies short windows of unusually high request failure rates.
 */

export interface BurstEntry {
  url: string;
  windowMs: number;
  totalRequests: number;
  failedRequests: number;
  failureRate: number;
  isBurst: boolean;
  detectedAt: string;
}

export interface BurstReport {
  generatedAt: string;
  windowMs: number;
  threshold: number;
  entries: BurstEntry[];
}

export interface BurstInput {
  url: string;
  durationMs: number;
  statusCode: number;
}

const DEFAULT_WINDOW_MS = 60_000;
const DEFAULT_THRESHOLD = 0.5;

export function detectBurst(
  inputs: BurstInput[],
  windowMs = DEFAULT_WINDOW_MS,
  threshold = DEFAULT_THRESHOLD
): BurstEntry[] {
  const grouped = new Map<string, BurstInput[]>();
  for (const input of inputs) {
    const list = grouped.get(input.url) ?? [];
    list.push(input);
    grouped.set(input.url, list);
  }

  const entries: BurstEntry[] = [];
  for (const [url, reqs] of grouped) {
    const total = reqs.length;
    const failed = reqs.filter(r => r.statusCode >= 500 || r.statusCode === 0).length;
    const failureRate = total === 0 ? 0 : failed / total;
    entries.push({
      url,
      windowMs,
      totalRequests: total,
      failedRequests: failed,
      failureRate: Math.round(failureRate * 1000) / 1000,
      isBurst: failureRate >= threshold,
      detectedAt: new Date().toISOString(),
    });
  }
  return entries;
}

export function buildBurstReport(
  inputs: BurstInput[],
  windowMs = DEFAULT_WINDOW_MS,
  threshold = DEFAULT_THRESHOLD
): BurstReport {
  return {
    generatedAt: new Date().toISOString(),
    windowMs,
    threshold,
    entries: detectBurst(inputs, windowMs, threshold),
  };
}

export function burstToJson(report: BurstReport): string {
  return JSON.stringify(report, null, 2);
}

export function formatBurstReport(report: BurstReport): string {
  const lines: string[] = [
    `Burst Report — ${report.generatedAt}`,
    `Window: ${report.windowMs}ms | Threshold: ${(report.threshold * 100).toFixed(0)}%`,
    '',
  ];
  for (const e of report.entries) {
    const flag = e.isBurst ? '🔴 BURST' : '✅ ok';
    lines.push(
      `${flag}  ${e.url}  failures=${e.failedRequests}/${e.totalRequests} (${(e.failureRate * 100).toFixed(1)}%)`
    );
  }
  return lines.join('\n');
}
