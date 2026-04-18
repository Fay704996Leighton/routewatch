export interface StaleEntry {
  url: string;
  lastSeenAt: number;
  staleSinceMs: number;
  isStale: boolean;
}

export interface StaleReport {
  generatedAt: string;
  entries: StaleEntry[];
  staleCount: number;
}

export function buildStaleEntry(
  url: string,
  lastSeenAt: number,
  thresholdMs: number,
  now = Date.now()
): StaleEntry {
  const staleSinceMs = now - lastSeenAt;
  return {
    url,
    lastSeenAt,
    staleSinceMs,
    isStale: staleSinceMs > thresholdMs,
  };
}

export function buildStaleReport(
  entries: StaleEntry[],
  now = Date.now()
): StaleReport {
  return {
    generatedAt: new Date(now).toISOString(),
    entries,
    staleCount: entries.filter((e) => e.isStale).length,
  };
}

export function staleToJson(report: StaleReport): string {
  return JSON.stringify(report, null, 2);
}

export function formatStaleReport(report: StaleReport): string {
  const lines: string[] = [
    `Stale Route Report — ${report.generatedAt}`,
    `Stale: ${report.staleCount} / ${report.entries.length}`,
    "",
  ];
  for (const e of report.entries) {
    const tag = e.isStale ? "[STALE]" : "[ok]";
    lines.push(`  ${tag} ${e.url}  (last seen ${e.staleSinceMs}ms ago)`);
  }
  return lines.join("\n");
}
