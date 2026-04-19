export interface ExpiryEntry {
  url: string;
  lastSeenAt: number;
  ttlMs: number;
  expired: boolean;
}

export interface ExpiryReport {
  generatedAt: number;
  entries: ExpiryEntry[];
  totalExpired: number;
}

export function buildExpiryEntry(
  url: string,
  lastSeenAt: number,
  ttlMs: number,
  now = Date.now()
): ExpiryEntry {
  return {
    url,
    lastSeenAt,
    ttlMs,
    expired: now - lastSeenAt > ttlMs,
  };
}

export function buildExpiryReport(
  entries: ExpiryEntry[],
  now = Date.now()
): ExpiryReport {
  return {
    generatedAt: now,
    entries,
    totalExpired: entries.filter((e) => e.expired).length,
  };
}

export function expiryToJson(report: ExpiryReport): string {
  return JSON.stringify(report, null, 2);
}

export function formatExpiryReport(report: ExpiryReport): string {
  const lines: string[] = [
    `Expiry Report — ${new Date(report.generatedAt).toISOString()}`,
    `Expired: ${report.totalExpired} / ${report.entries.length}`,
    "",
  ];
  for (const e of report.entries) {
    const age = Math.round((Date.now() - e.lastSeenAt) / 1000);
    const status = e.expired ? "EXPIRED" : "OK";
    lines.push(`  [${status}] ${e.url}  age=${age}s  ttl=${Math.round(e.ttlMs / 1000)}s`);
  }
  return lines.join("\n");
}
