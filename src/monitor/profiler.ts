export interface ProfileEntry {
  url: string;
  method: string;
  p50: number;
  p95: number;
  p99: number;
  min: number;
  max: number;
  sampleCount: number;
}

export interface ProfileReport {
  generatedAt: string;
  entries: ProfileEntry[];
}

export function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, idx)];
}

export function buildProfileEntry(
  url: string,
  method: string,
  durations: number[]
): ProfileEntry {
  const sorted = [...durations].sort((a, b) => a - b);
  return {
    url,
    method,
    p50: percentile(sorted, 50),
    p95: percentile(sorted, 95),
    p99: percentile(sorted, 99),
    min: sorted[0] ?? 0,
    max: sorted[sorted.length - 1] ?? 0,
    sampleCount: sorted.length,
  };
}

export function buildProfileReport(
  entries: ProfileEntry[]
): ProfileReport {
  return {
    generatedAt: new Date().toISOString(),
    entries,
  };
}

export function profileToJson(report: ProfileReport): string {
  return JSON.stringify(report, null, 2);
}
