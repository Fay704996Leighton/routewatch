/**
 * Jitter detection: measures variability in response times across poll results.
 */

import type { PollResult } from "./types";

export interface JitterEntry {
  route: string;
  min: number;
  max: number;
  mean: number;
  jitter: number; // max - min
  cv: number;     // coefficient of variation (stddev / mean)
}

export interface JitterReport {
  entries: JitterEntry[];
  generatedAt: string;
}

function mean(values: number[]): number {
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function stddev(values: number[], avg: number): number {
  const variance = values.reduce((sum, v) => sum + (v - avg) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

export function computeJitterEntry(route: string, durations: number[]): JitterEntry {
  if (durations.length === 0) {
    return { route, min: 0, max: 0, mean: 0, jitter: 0, cv: 0 };
  }
  const avg = mean(durations);
  const sd = stddev(durations, avg);
  return {
    route,
    min: Math.min(...durations),
    max: Math.max(...durations),
    mean: Math.round(avg),
    jitter: Math.max(...durations) - Math.min(...durations),
    cv: avg > 0 ? parseFloat((sd / avg).toFixed(4)) : 0,
  };
}

export function buildJitterReport(results: PollResult[]): JitterReport {
  const grouped = new Map<string, number[]>();
  for (const r of results) {
    if (!grouped.has(r.route)) grouped.set(r.route, []);
    if (r.status === "success" && r.duration != null) {
      grouped.get(r.route)!.push(r.duration);
    }
  }
  const entries: JitterEntry[] = [];
  for (const [route, durations] of grouped) {
    entries.push(computeJitterEntry(route, durations));
  }
  return { entries, generatedAt: new Date().toISOString() };
}

export function jitterToJson(report: JitterReport): string {
  return JSON.stringify(report, null, 2);
}

export function formatJitterReport(report: JitterReport): string {
  const lines: string[] = ["Jitter Report", "=============="];
  for (const e of report.entries) {
    lines.push(`${e.route}`);
    lines.push(`  min=${e.min}ms  max=${e.max}ms  mean=${e.mean}ms  jitter=${e.jitter}ms  cv=${e.cv}`);
  }
  return lines.join("\n");
}
