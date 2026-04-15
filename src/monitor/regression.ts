import { BaselineEntry } from "./baseline";
import { PollResult } from "./types";

export interface RegressionResult {
  url: string;
  baseline: BaselineEntry;
  currentAvg: number;
  currentP95: number;
  avgDeltaPct: number;
  p95DeltaPct: number;
  isRegression: boolean;
  reason: string[];
}

export interface RegressionConfig {
  avgThresholdPct: number;
  p95ThresholdPct: number;
}

const DEFAULT_CONFIG: RegressionConfig = {
  avgThresholdPct: 20,
  p95ThresholdPct: 30,
};

export function detectRegression(
  results: PollResult[],
  baseline: BaselineEntry,
  config: RegressionConfig = DEFAULT_CONFIG
): RegressionResult {
  const durations = results
    .filter((r) => r.durationMs !== undefined)
    .map((r) => r.durationMs as number)
    .sort((a, b) => a - b);

  const currentAvg =
    durations.length > 0
      ? Math.round(durations.reduce((s, d) => s + d, 0) / durations.length)
      : 0;

  const p95Index = Math.floor(durations.length * 0.95);
  const currentP95 =
    durations.length > 0
      ? durations[Math.min(p95Index, durations.length - 1)]
      : 0;

  const avgDeltaPct =
    baseline.avgDuration > 0
      ? ((currentAvg - baseline.avgDuration) / baseline.avgDuration) * 100
      : 0;

  const p95DeltaPct =
    baseline.p95Duration > 0
      ? ((currentP95 - baseline.p95Duration) / baseline.p95Duration) * 100
      : 0;

  const reasons: string[] = [];
  if (avgDeltaPct > config.avgThresholdPct) {
    reasons.push(
      `avg duration increased by ${avgDeltaPct.toFixed(1)}% (threshold: ${config.avgThresholdPct}%)`
    );
  }
  if (p95DeltaPct > config.p95ThresholdPct) {
    reasons.push(
      `p95 duration increased by ${p95DeltaPct.toFixed(1)}% (threshold: ${config.p95ThresholdPct}%)`
    );
  }

  return {
    url: baseline.url,
    baseline,
    currentAvg,
    currentP95,
    avgDeltaPct,
    p95DeltaPct,
    isRegression: reasons.length > 0,
    reason: reasons,
  };
}
