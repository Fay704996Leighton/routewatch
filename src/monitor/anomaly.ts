import { PollResult } from "./types";
import { HistoryEntry } from "./history";

export interface AnomalyResult {
  url: string;
  method: string;
  zScore: number;
  duration: number;
  mean: number;
  stddev: number;
  isAnomaly: boolean;
}

export function computeStddev(values: number[], mean: number): number {
  if (values.length < 2) return 0;
  const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
  return Math.sqrt(variance);
}

export function computeZScore(value: number, mean: number, stddev: number): number {
  if (stddev === 0) return 0;
  return (value - mean) / stddev;
}

export function detectAnomalies(
  results: PollResult[],
  history: HistoryEntry[],
  zThreshold = 2.5
): AnomalyResult[] {
  return results
    .filter((r) => r.status === "success" && r.duration !== undefined)
    .map((r) => {
      const past = history
        .filter((h) => h.url === r.url && h.method === r.method && h.duration !== undefined)
        .map((h) => h.duration as number);

      if (past.length < 3) {
        return null;
      }

      const mean = past.reduce((a, b) => a + b, 0) / past.length;
      const stddev = computeStddev(past, mean);
      const zScore = computeZScore(r.duration!, mean, stddev);

      return {
        url: r.url,
        method: r.method,
        zScore,
        duration: r.duration!,
        mean,
        stddev,
        isAnomaly: Math.abs(zScore) >= zThreshold,
      } as AnomalyResult;
    })
    .filter((r): r is AnomalyResult => r !== null);
}
