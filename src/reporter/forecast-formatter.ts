import { ForecastReport, ForecastEntry } from "../monitor/forecast";

export function formatForecastEntry(entry: ForecastEntry): string {
  const status = entry.willExceedThreshold ? "EXCEED" : "OK";
  return (
    `[${status}] ${entry.url}\n` +
    `  current: ${entry.currentAvg.toFixed(1)}ms | ` +
    `slope: ${entry.slope.toFixed(2)} | ` +
    `forecast(+${entry.horizon}): ${entry.forecastMs.toFixed(1)}ms | ` +
    `threshold: ${entry.thresholdMs}ms`
  );
}

export function formatForecastReportText(report: ForecastReport): string {
  const exceeding = report.entries.filter((e) => e.willExceedThreshold);
  const lines = [
    `Forecast Report — horizon: ${report.horizon} | generated: ${report.generatedAt}`,
    `Entries: ${report.entries.length} | Exceeding threshold: ${exceeding.length}`,
    "-".repeat(60),
    ...report.entries.map(formatForecastEntry),
  ];
  return lines.join("\n");
}

export function forecastSummaryLine(report: ForecastReport): string {
  const count = report.entries.filter((e) => e.willExceedThreshold).length;
  if (count === 0) return `forecast: all ${report.entries.length} routes within threshold`;
  return `forecast: ${count}/${report.entries.length} route(s) projected to exceed threshold`;
}

export function forecastReportToJson(report: ForecastReport): string {
  return JSON.stringify(report, null, 2);
}
