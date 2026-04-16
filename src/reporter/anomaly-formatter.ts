import { AnomalyResult } from "../monitor/anomaly";

export interface AnomalyReportEntry {
  url: string;
  method: string;
  duration: number;
  mean: number;
  stddev: number;
  zScore: number;
  isAnomaly: boolean;
}

export function buildAnomalyReport(anomalies: AnomalyResult[]): AnomalyReportEntry[] {
  return anomalies.map((a) => ({
    url: a.url,
    method: a.method,
    duration: Math.round(a.duration),
    mean: Math.round(a.mean),
    stddev: parseFloat(a.stddev.toFixed(2)),
    zScore: parseFloat(a.zScore.toFixed(2)),
    isAnomaly: a.isAnomaly,
  }));
}

export function formatAnomalyEntry(entry: AnomalyReportEntry): string {
  const flag = entry.isAnomaly ? "[ANOMALY]" : "[OK]";
  return `${flag} ${entry.method} ${entry.url} | duration=${entry.duration}ms mean=${entry.mean}ms stddev=${entry.stddev} z=${entry.zScore}`;
}

export function formatAnomalyReport(entries: AnomalyReportEntry[]): string {
  if (entries.length === 0) return "No anomaly data.";
  const lines = ["=== Anomaly Detection Report ===", ""];
  for (const e of entries) {
    lines.push(formatAnomalyEntry(e));
  }
  return lines.join("\n");
}

export function anomalyToJson(entries: AnomalyReportEntry[]): string {
  return JSON.stringify(entries, null, 2);
}
