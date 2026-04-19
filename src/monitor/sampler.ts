import { PollResult } from "./types";

export interface SampleWindow {
  url: string;
  samples: number[];
  count: number;
  min: number;
  max: number;
  mean: number;
  p95: number;
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, idx)];
}

export function buildSampleWindow(url: string, results: PollResult[]): SampleWindow {
  const durations = results
    .filter((r) => r.status === "success" && typeof r.duration === "number")
    .map((r) => r.duration as number)
    .sort((a, b) => a - b);

  if (durations.length === 0) {
    return { url, samples: [], count: 0, min: 0, max: 0, mean: 0, p95: 0 };
  }

  const sum = durations.reduce((a, b) => a + b, 0);
  return {
    url,
    samples: durations,
    count: durations.length,
    min: durations[0],
    max: durations[durations.length - 1],
    mean: Math.round(sum / durations.length),
    p95: percentile(durations, 95),
  };
}

export function buildSamplerReport(results: PollResult[]): SampleWindow[] {
  const grouped = new Map<string, PollResult[]>();
  for (const r of results) {
    const list = grouped.get(r.url) ?? [];
    list.push(r);
    grouped.set(r.url, list);
  }
  return Array.from(grouped.entries()).map(([url, rs]) => buildSampleWindow(url, rs));
}

export function samplerToJson(report: SampleWindow[]): string {
  return JSON.stringify(report, null, 2);
}

export function formatSamplerReport(report: SampleWindow[]): string {
  if (report.length === 0) return "No samples collected.";
  return reportn    .map(
      (w) =>
        `[${w.url}] n=${w.count} min=${w.min}ms mean=${w.mean}ms p95=${w.p95}ms max=${w.max}ms`
    )
    .join("\n");
}
