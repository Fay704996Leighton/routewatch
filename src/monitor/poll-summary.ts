import { PollResult } from './types';

export interface PollSummary {
  total: number;
  succeeded: number;
  failed: number;
  averageDurationMs: number;
  slowestRoute: string | null;
  fastestRoute: string | null;
}

export function summarizePollResults(results: PollResult[]): PollSummary {
  if (results.length === 0) {
    return {
      total: 0,
      succeeded: 0,
      failed: 0,
      averageDurationMs: 0,
      slowestRoute: null,
      fastestRoute: null,
    };
  }

  const succeeded = results.filter((r) => !r.error && r.status < 400);
  const failed = results.filter((r) => r.error || r.status >= 400);

  const totalDuration = succeeded.reduce((sum, r) => sum + r.durationMs, 0);
  const averageDurationMs =
    succeeded.length > 0 ? totalDuration / succeeded.length : 0;

  let slowest: PollResult | null = null;
  let fastest: PollResult | null = null;

  for (const r of succeeded) {
    if (!slowest || r.durationMs > slowest.durationMs) slowest = r;
    if (!fastest || r.durationMs < fastest.durationMs) fastest = r;
  }

  return {
    total: results.length,
    succeeded: succeeded.length,
    failed: failed.length,
    averageDurationMs: Math.round(averageDurationMs * 100) / 100,
    slowestRoute: slowest ? slowest.route.name : null,
    fastestRoute: fastest ? fastest.route.name : null,
  };
}
