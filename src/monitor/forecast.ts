import { TrendReport, TrendEntry } from "./trend";

export interface ForecastEntry {
  url: string;
  currentAvg: number;
  slope: number;
  forecastMs: number;
  horizon: number;
  willExceedThreshold: boolean;
  thresholdMs: number;
}

export interface ForecastReport {
  generatedAt: string;
  horizon: number;
  entries: ForecastEntry[];
}

export function buildForecastEntry(
  entry: TrendEntry,
  horizon: number,
  thresholdMs: number
): ForecastEntry {
  const forecastMs = entry.avgDuration + entry.slope * horizon;
  return {
    url: entry.url,
    currentAvg: entry.avgDuration,
    slope: entry.slope,
    forecastMs: Math.max(0, forecastMs),
    horizon,
    willExceedThreshold: forecastMs > thresholdMs,
    thresholdMs,
  };
}

export function buildForecastReport(
  trend: TrendReport,
  horizon: number,
  thresholdMs: number
): ForecastReport {
  return {
    generatedAt: new Date().toISOString(),
    horizon,
    entries: trend.entries.map((e) => buildForecastEntry(e, horizon, thresholdMs)),
  };
}

export function forecastToJson(report: ForecastReport): string {
  return JSON.stringify(report, null, 2);
}

export function formatForecastReport(report: ForecastReport): string {
  const lines: string[] = [
    `Forecast Report (horizon: ${report.horizon} samples) — ${report.generatedAt}`,
    "-".repeat(60),
  ];
  for (const e of report.entries) {
    const flag = e.willExceedThreshold ? " [EXCEED]" : "";
    lines.push(
      `${e.url}${flag}\n  current: ${e.currentAvg.toFixed(1)}ms  slope: ${e.slope.toFixed(2)}  forecast: ${e.forecastMs.toFixed(1)}ms  threshold: ${e.thresholdMs}ms`
    );
  }
  return lines.join("\n");
}
