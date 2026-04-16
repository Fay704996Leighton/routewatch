import { HistoryEntry } from "./history";

export interface TrendEntry {
  route: string;
  slope: number; // ms per sample
  direction: "improving" | "degrading" | "stable";
  sampleCount: number;
  firstAvg: number;
  lastAvg: number;
}

export interface TrendReport {
  generatedAt: string;
  entries: TrendEntry[];
}

/** Linear regression slope via least-squares */
export function computeSlope(values: number[]): number {
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

export function classifySlope(slope: number, threshold = 5): TrendEntry["direction"] {
  if (slope > threshold) return "degrading";
  if (slope < -threshold) return "improving";
  return "stable";
}

export function buildTrendReport(history: HistoryEntry[]): TrendReport {
  const grouped = new Map<string, number[]>();
  for (const h of history) {
    if (!grouped.has(h.route)) grouped.set(h.route, []);
    grouped.get(h.route)!.push(h.avgDuration);
  }

  const entries: TrendEntry[] = [];
  for (const [route, durations] of grouped) {
    const slope = computeSlope(durations);
    entries.push({
      route,
      slope: parseFloat(slope.toFixed(3)),
      direction: classifySlope(slope),
      sampleCount: durations.length,
      firstAvg: durations[0],
      lastAvg: durations[durations.length - 1],
    });
  }

  return { generatedAt: new Date().toISOString(), entries };
}
