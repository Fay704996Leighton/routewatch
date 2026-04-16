import { TrendReport, TrendEntry } from "../monitor/trend";

const DIRECTION_SYMBOL: Record<TrendEntry["direction"], string> = {
  degrading: "↑",
  improving: "↓",
  stable: "→",
};

export function formatTrendEntry(entry: TrendEntry): string {
  const sym = DIRECTION_SYMBOL[entry.direction];
  return (
    `  ${sym} ${entry.route}\n` +
    `     direction : ${entry.direction}\n` +
    `     slope     : ${entry.slope} ms/sample\n` +
    `     first avg : ${entry.firstAvg} ms  →  last avg : ${entry.lastAvg} ms\n` +
    `     samples   : ${entry.sampleCount}`
  );
}

export function formatTrendReport(report: TrendReport): string {
  if (report.entries.length === 0) {
    return `Trend Report (${report.generatedAt})\nNo trend data available.`;
  }
  const lines = [`Trend Report (${report.generatedAt})`, ""];
  for (const entry of report.entries) {
    lines.push(formatTrendEntry(entry));
    lines.push("");
  }
  return lines.join("\n").trimEnd();
}

export function trendToJson(report: TrendReport): string {
  return JSON.stringify(report, null, 2);
}
