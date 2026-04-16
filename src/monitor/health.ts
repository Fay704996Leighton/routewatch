import { PollResult } from "./types";

export type HealthStatus = "healthy" | "degraded" | "down";

export interface HealthSummary {
  url: string;
  status: HealthStatus;
  successRate: number;
  totalChecks: number;
  failedChecks: number;
  avgDurationMs: number;
}

export function computeHealthStatus(successRate: number): HealthStatus {
  if (successRate >= 0.95) return "healthy";
  if (successRate >= 0.5) return "degraded";
  return "down";
}

export function buildHealthSummary(url: string, results: PollResult[]): HealthSummary {
  if (results.length === 0) {
    return { url, status: "down", successRate: 0, totalChecks: 0, failedChecks: 0, avgDurationMs: 0 };
  }

  const total = results.length;
  const failed = results.filter(r => r.status === "error" || r.status === "timeout").length;
  const successful = total - failed;
  const successRate = successful / total;

  const durations = results
    .filter(r => typeof r.durationMs === "number")
    .map(r => r.durationMs as number);
  const avgDurationMs = durations.length > 0
    ? durations.reduce((a, b) => a + b, 0) / durations.length
    : 0;

  return {
    url,
    status: computeHealthStatus(successRate),
    successRate,
    totalChecks: total,
    failedChecks: failed,
    avgDurationMs: Math.round(avgDurationMs),
  };
}

export function buildHealthReport(grouped: Record<string, PollResult[]>): HealthSummary[] {
  return Object.entries(grouped).map(([url, results]) => buildHealthSummary(url, results));
}
