import { SchemaDriftResult } from "./types";

export interface DriftEntry {
  url: string;
  checkedAt: string;
  addedKeys: string[];
  removedKeys: string[];
  driftScore: number;
}

export interface DriftReport {
  entries: DriftEntry[];
  totalDrifted: number;
  mostVolatile: string | null;
}

export function computeDriftScore(added: string[], removed: string[]): number {
  return added.length + removed.length * 2;
}

export function buildDriftEntry(url: string, drift: SchemaDriftResult): DriftEntry {
  return {
    url,
    checkedAt: new Date().toISOString(),
    addedKeys: drift.addedKeys,
    removedKeys: drift.removedKeys,
    driftScore: computeDriftScore(drift.addedKeys, drift.removedKeys),
  };
}

export function buildDriftReport(entries: DriftEntry[]): DriftReport {
  const drifted = entries.filter((e) => e.driftScore > 0);

  let mostVolatile: string | null = null;
  let maxScore = 0;
  for (const e of drifted) {
    if (e.driftScore > maxScore) {
      maxScore = e.driftScore;
      mostVolatile = e.url;
    }
  }

  return {
    entries,
    totalDrifted: drifted.length,
    mostVolatile,
  };
}

export function driftReportToJson(report: DriftReport): string {
  return JSON.stringify(report, null, 2);
}

export function formatDriftReport(report: DriftReport): string {
  const lines: string[] = ["=== Schema Drift Report ==="];
  lines.push(`Total endpoints with drift: ${report.totalDrifted}`);
  if (report.mostVolatile) {
    lines.push(`Most volatile: ${report.mostVolatile}`);
  }
  for (const e of report.entries) {
    if (e.driftScore === 0) continue;
    lines.push(`\n[${e.url}] score=${e.driftScore} at ${e.checkedAt}`);
    if (e.addedKeys.length) lines.push(`  + added: ${e.addedKeys.join(", ")}`);
    if (e.removedKeys.length) lines.push(`  - removed: ${e.removedKeys.join(", ")}`);
  }
  return lines.join("\n");
}
