/**
 * Drain detection: identifies endpoints whose response times are steadily
 * worsening over successive windows, suggesting resource exhaustion.
 */

export interface DrainEntry {
  url: string;
  windowCount: number;
  avgDurations: number[];
  drainRate: number; // ms per window
  isDraining: boolean;
  severity: "low" | "medium" | "high";
}

export interface DrainReport {
  generatedAt: string;
  entries: DrainEntry[];
  drainingCount: number;
}

export function classifyDrainSeverity(
  drainRate: number
): "low" | "medium" | "high" {
  if (drainRate >= 200) return "high";
  if (drainRate >= 80) return "medium";
  return "low";
}

/** Compute the average rate of increase (ms per step) using linear regression slope. */
export function computeDrainRate(values: number[]): number {
  const n = values.length;
  if (n < 2) return 0;
  const meanX = (n - 1) / 2;
  const meanY = values.reduce((a, b) => a + b, 0) / n;
  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    num += (i - meanX) * (values[i] - meanY);
    den += (i - meanX) ** 2;
  }
  return den === 0 ? 0 : num / den;
}

export function buildDrainEntry(
  url: string,
  avgDurations: number[],
  drainThreshold = 50
): DrainEntry {
  const drainRate = computeDrainRate(avgDurations);
  const isDraining = drainRate >= drainThreshold;
  return {
    url,
    windowCount: avgDurations.length,
    avgDurations,
    drainRate: Math.round(drainRate * 100) / 100,
    isDraining,
    severity: isDraining ? classifyDrainSeverity(drainRate) : "low",
  };
}

export function buildDrainReport(
  entries: DrainEntry[]
): DrainReport {
  return {
    generatedAt: new Date().toISOString(),
    entries,
    drainingCount: entries.filter((e) => e.isDraining).length,
  };
}

export function drainToJson(report: DrainReport): string {
  return JSON.stringify(report, null, 2);
}

export function formatDrainReport(report: DrainReport): string {
  const lines: string[] = [
    `Drain Report — ${report.generatedAt}`,
    `Draining endpoints: ${report.drainingCount}/${report.entries.length}`,
    "",
  ];
  for (const e of report.entries) {
    const flag = e.isDraining ? `[${e.severity.toUpperCase()}]` : "[ok]";
    lines.push(
      `${flag} ${e.url}  drain_rate=${e.drainRate}ms/window  windows=${e.windowCount}`
    );
  }
  return lines.join("\n");
}
