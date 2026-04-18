export type LatencyBand = "fast" | "normal" | "slow" | "critical";

export interface LatencyBandEntry {
  url: string;
  avgMs: number;
  band: LatencyBand;
  thresholds: LatencyBandThresholds;
}

export interface LatencyBandThresholds {
  fast: number;    // below this => fast
  normal: number;  // below this => normal
  slow: number;    // below this => slow
  // above slow => critical
}

export const DEFAULT_THRESHOLDS: LatencyBandThresholds = {
  fast: 200,
  normal: 500,
  slow: 1500,
};

export function classifyLatency(
  avgMs: number,
  thresholds: LatencyBandThresholds = DEFAULT_THRESHOLDS
): LatencyBand {
  if (avgMs < thresholds.fast) return "fast";
  if (avgMs < thresholds.normal) return "normal";
  if (avgMs < thresholds.slow) return "slow";
  return "critical";
}

export function buildLatencyBandEntry(
  url: string,
  durations: number[],
  thresholds: LatencyBandThresholds = DEFAULT_THRESHOLDS
): LatencyBandEntry {
  const avgMs =
    durations.length === 0
      ? 0
      : durations.reduce((a, b) => a + b, 0) / durations.length;
  return {
    url,
    avgMs,
    band: classifyLatency(avgMs, thresholds),
    thresholds,
  };
}

export function buildLatencyBandReport(
  entries: LatencyBandEntry[]
): Record<LatencyBand, LatencyBandEntry[]> {
  const report: Record<LatencyBand, LatencyBandEntry[]> = {
    fast: [],
    normal: [],
    slow: [],
    critical: [],
  };
  for (const entry of entries) {
    report[entry.band].push(entry);
  }
  return report;
}
