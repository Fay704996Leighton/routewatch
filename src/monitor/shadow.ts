export interface ShadowEntry {
  url: string;
  primary: number;
  shadow: number;
  delta: number;
  deltaPercent: number;
  timestamp: string;
}

export interface ShadowReport {
  entries: ShadowEntry[];
  totalCompared: number;
  avgDelta: number;
  maxDelta: number;
}

export function buildShadowEntry(
  url: string,
  primary: number,
  shadow: number
): ShadowEntry {
  const delta = shadow - primary;
  const deltaPercent = primary > 0 ? (delta / primary) * 100 : 0;
  return {
    url,
    primary,
    shadow,
    delta,
    deltaPercent: parseFloat(deltaPercent.toFixed(2)),
    timestamp: new Date().toISOString(),
  };
}

export function buildShadowReport(entries: ShadowEntry[]): ShadowReport {
  if (entries.length === 0) {
    return { entries: [], totalCompared: 0, avgDelta: 0, maxDelta: 0 };
  }
  const deltas = entries.map((e) => Math.abs(e.delta));
  const avgDelta = deltas.reduce((a, b) => a + b, 0) / deltas.length;
  const maxDelta = Math.max(...deltas);
  return {
    entries,
    totalCompared: entries.length,
    avgDelta: parseFloat(avgDelta.toFixed(2)),
    maxDelta,
  };
}

export function shadowToJson(report: ShadowReport): string {
  return JSON.stringify(report, null, 2);
}

export function formatShadowReport(report: ShadowReport): string {
  const lines: string[] = [`Shadow Comparison Report (${report.totalCompared} routes)`, ""];
  for (const e of report.entries) {
    const sign = e.delta >= 0 ? "+" : "";
    lines.push(`  ${e.url}`);
    lines.push(`    primary=${e.primary}ms  shadow=${e.shadow}ms  delta=${sign}${e.delta}ms (${sign}${e.deltaPercent}%)`);
  }
  lines.push("");
  lines.push(`  avg delta: ${report.avgDelta}ms  max delta: ${report.maxDelta}ms`);
  return lines.join("\n");
}
