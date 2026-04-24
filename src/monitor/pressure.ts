/**
 * Pressure: tracks concurrent in-flight request count and derives a
 * load-pressure level (low / medium / high / critical).
 */

export type PressureLevel = "low" | "medium" | "high" | "critical";

export interface PressureEntry {
  url: string;
  inFlight: number;
  peak: number;
  level: PressureLevel;
  timestamp: string;
}

export interface PressureReport {
  generatedAt: string;
  entries: PressureEntry[];
}

export function classifyPressure(inFlight: number, maxConcurrent: number): PressureLevel {
  const ratio = maxConcurrent > 0 ? inFlight / maxConcurrent : 0;
  if (ratio >= 1.0) return "critical";
  if (ratio >= 0.75) return "high";
  if (ratio >= 0.4) return "medium";
  return "low";
}

export function buildPressureEntry(
  url: string,
  inFlight: number,
  peak: number,
  maxConcurrent: number
): PressureEntry {
  return {
    url,
    inFlight,
    peak,
    level: classifyPressure(inFlight, maxConcurrent),
    timestamp: new Date().toISOString(),
  };
}

export function buildPressureReport(entries: PressureEntry[]): PressureReport {
  return {
    generatedAt: new Date().toISOString(),
    entries,
  };
}

export function pressureToJson(report: PressureReport): string {
  return JSON.stringify(report, null, 2);
}

export function formatPressureReport(report: PressureReport): string {
  const lines: string[] = [`Pressure Report — ${report.generatedAt}`, ""];
  for (const e of report.entries) {
    lines.push(
      `  [${e.level.toUpperCase().padEnd(8)}] ${e.url}  in-flight=${e.inFlight}  peak=${e.peak}`
    );
  }
  if (report.entries.length === 0) lines.push("  (no data)");
  return lines.join("\n");
}
