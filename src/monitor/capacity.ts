export interface CapacityEntry {
  url: string;
  avgDuration: number;
  p95Duration: number;
  requestsPerMinute: number;
  estimatedMaxRpm: number;
  utilizationPct: number;
  status: 'ok' | 'warning' | 'critical';
}

export interface CapacityReport {
  generatedAt: string;
  entries: CapacityEntry[];
}

export function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, idx)];
}

export function buildCapacityEntry(
  url: string,
  durations: number[],
  requestsPerMinute: number,
  targetMaxDurationMs = 2000
): CapacityEntry {
  const sorted = [...durations].sort((a, b) => a - b);
  const avgDuration = sorted.reduce((s, v) => s + v, 0) / (sorted.length || 1);
  const p95Duration = percentile(sorted, 95);
  const estimatedMaxRpm = targetMaxDurationMs > 0
    ? Math.floor((60_000 / targetMaxDurationMs) * 10)
    : 0;
  const utilizationPct = estimatedMaxRpm > 0
    ? Math.min(100, Math.round((requestsPerMinute / estimatedMaxRpm) * 100))
    : 100;
  const status =
    utilizationPct >= 90 ? 'critical' :
    utilizationPct >= 70 ? 'warning' : 'ok';
  return { url, avgDuration, p95Duration, requestsPerMinute, estimatedMaxRpm, utilizationPct, status };
}

export function buildCapacityReport(entries: CapacityEntry[]): CapacityReport {
  return { generatedAt: new Date().toISOString(), entries };
}

export function capacityToJson(report: CapacityReport): string {
  return JSON.stringify(report, null, 2);
}

export function formatCapacityReport(report: CapacityReport): string {
  const lines: string[] = [`Capacity Report — ${report.generatedAt}`, ''];
  for (const e of report.entries) {
    lines.push(`  ${e.url}`);
    lines.push(`    avg: ${e.avgDuration.toFixed(1)}ms  p95: ${e.p95Duration.toFixed(1)}ms`);
    lines.push(`    rpm: ${e.requestsPerMinute}  maxRpm: ${e.estimatedMaxRpm}  utilization: ${e.utilizationPct}%  [${e.status.toUpperCase()}]`);
  }
  return lines.join('\n');
}
