// Mirror compares two endpoints (primary vs shadow/mirror) and reports divergence

export interface MirrorEntry {
  url: string;
  mirrorUrl: string;
  statusMatch: boolean;
  primaryStatus: number;
  mirrorStatus: number;
  durationDeltaMs: number;
  bodyMatch: boolean;
  timestamp: string;
}

export interface MirrorReport {
  entries: MirrorEntry[];
  totalCompared: number;
  diverged: number;
}

export function buildMirrorEntry(
  url: string,
  mirrorUrl: string,
  primaryStatus: number,
  mirrorStatus: number,
  primaryDuration: number,
  mirrorDuration: number,
  primaryBody: unknown,
  mirrorBody: unknown
): MirrorEntry {
  return {
    url,
    mirrorUrl,
    statusMatch: primaryStatus === mirrorStatus,
    primaryStatus,
    mirrorStatus,
    durationDeltaMs: Math.abs(primaryDuration - mirrorDuration),
    bodyMatch: JSON.stringify(primaryBody) === JSON.stringify(mirrorBody),
    timestamp: new Date().toISOString(),
  };
}

export function buildMirrorReport(entries: MirrorEntry[]): MirrorReport {
  const diverged = entries.filter((e) => !e.statusMatch || !e.bodyMatch).length;
  return { entries, totalCompared: entries.length, diverged };
}

export function mirrorToJson(report: MirrorReport): string {
  return JSON.stringify(report, null, 2);
}

export function formatMirrorReport(report: MirrorReport): string {
  const lines: string[] = [`Mirror Report — ${report.totalCompared} compared, ${report.diverged} diverged`];
  for (const e of report.entries) {
    const status = e.statusMatch ? "OK" : `MISMATCH(${e.primaryStatus} vs ${e.mirrorStatus})`;
    const body = e.bodyMatch ? "body-match" : "body-drift";
    lines.push(`  ${e.url} -> ${e.mirrorUrl}: ${status}, ${body}, Δ${e.durationDeltaMs}ms`);
  }
  return lines.join("\n");
}
