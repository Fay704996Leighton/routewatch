/**
 * Saturation monitor: tracks how close endpoints are to their
 * theoretical throughput ceiling based on recent latency trends.
 */

export interface SaturationEntry {
  url: string;
  avgDuration: number;
  p95Duration: number;
  maxDuration: number;
  saturationPct: number; // 0–100
  level: "low" | "moderate" | "high" | "critical";
}

export interface SaturationReport {
  generatedAt: string;
  entries: SaturationEntry[];
}

export function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, idx)];
}

export function classifySaturation(pct: number): SaturationEntry["level"] {
  if (pct >= 90) return "critical";
  if (pct >= 70) return "high";
  if (pct >= 40) return "moderate";
  return "low";
}

export function buildSaturationEntry(
  url: string,
  durations: number[],
  ceilingMs: number
): SaturationEntry {
  if (durations.length === 0) {
    return { url, avgDuration: 0, p95Duration: 0, maxDuration: 0, saturationPct: 0, level: "low" };
  }
  const sorted = [...durations].sort((a, b) => a - b);
  const avg = durations.reduce((s, d) => s + d, 0) / durations.length;
  const p95 = percentile(sorted, 95);
  const max = sorted[sorted.length - 1];
  const saturationPct = Math.min(100, Math.round((p95 / ceilingMs) * 100));
  return {
    url,
    avgDuration: Math.round(avg),
    p95Duration: p95,
    maxDuration: max,
    saturationPct,
    level: classifySaturation(saturationPct),
  };
}

export function buildSaturationReport(
  entries: SaturationEntry[]
): SaturationReport {
  return { generatedAt: new Date().toISOString(), entries };
}

export function saturationToJson(report: SaturationReport): string {
  return JSON.stringify(report, null, 2);
}

export function formatSaturationReport(report: SaturationReport): string {
  const lines: string[] = [`Saturation Report — ${report.generatedAt}`, ""];
  for (const e of report.entries) {
    lines.push(`  ${e.url}`);
    lines.push(`    avg=${e.avgDuration}ms  p95=${e.p95Duration}ms  max=${e.maxDuration}ms`);
    lines.push(`    saturation=${e.saturationPct}%  level=${e.level}`);
    lines.push("");
  }
  return lines.join("\n");
}
