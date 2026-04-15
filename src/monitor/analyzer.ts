import { ResponseSample } from './types';

export interface RegressionResult {
  endpoint: string;
  baseline: number;
  current: number;
  deltaMs: number;
  deltaPercent: number;
  regressed: boolean;
}

export interface AnalyzerOptions {
  thresholdPercent: number; // e.g. 20 means 20% slower triggers regression
  thresholdMs: number;      // absolute ms threshold
}

const DEFAULT_OPTIONS: AnalyzerOptions = {
  thresholdPercent: 20,
  thresholdMs: 200,
};

export function analyzeResponseTimes(
  baseline: ResponseSample[],
  current: ResponseSample[],
  options: Partial<AnalyzerOptions> = {}
): RegressionResult[] {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const results: RegressionResult[] = [];

  for (const cur of current) {
    const base = baseline.find((b) => b.endpoint === cur.endpoint);
    if (!base) continue;

    const deltaMs = cur.durationMs - base.durationMs;
    const deltaPercent = (deltaMs / base.durationMs) * 100;
    const regressed =
      deltaMs > opts.thresholdMs && deltaPercent > opts.thresholdPercent;

    results.push({
      endpoint: cur.endpoint,
      baseline: base.durationMs,
      current: cur.durationMs,
      deltaMs,
      deltaPercent,
      regressed,
    });
  }

  return results;
}

export function averageDuration(samples: ResponseSample[]): number {
  if (samples.length === 0) return 0;
  const total = samples.reduce((sum, s) => sum + s.durationMs, 0);
  return total / samples.length;
}
