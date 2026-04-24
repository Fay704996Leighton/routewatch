import type { WindowStats } from "../monitor/window.js";

export interface WindowReport {
  generatedAt: string;
  windows: WindowStats[];
}

export function buildWindowReport(stats: WindowStats[]): WindowReport {
  return {
    generatedAt: new Date().toISOString(),
    windows: stats,
  };
}

export function formatWindowEntry(s: WindowStats): string {
  return (
    `  [${s.route}] count=${s.count} ` +
    `min=${s.min}ms avg=${s.avg.toFixed(1)}ms ` +
    `p95=${s.p95}ms max=${s.max}ms`
  );
}

export function formatWindowReport(report: WindowReport): string {
  const lines: string[] = [
    `Sliding Window Report — ${report.generatedAt}`,
    "─".repeat(52),
  ];
  if (report.windows.length === 0) {
    lines.push("  No window data available.");
  } else {
    for (const s of report.windows) {
      lines.push(formatWindowEntry(s));
    }
  }
  return lines.join("\n");
}

export function windowToJson(report: WindowReport): string {
  return JSON.stringify(report, null, 2);
}

/**
 * Returns the WindowStats entry with the highest average latency,
 * or undefined if the report contains no windows.
 */
export function slowestWindow(report: WindowReport): WindowStats | undefined {
  if (report.windows.length === 0) return undefined;
  return report.windows.reduce((worst, current) =>
    current.avg > worst.avg ? current : worst
  );
}
