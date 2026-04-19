export interface TraceEntry {
  url: string;
  traceId: string;
  startedAt: string;
  duration: number;
  statusCode: number | null;
  hops: TraceHop[];
}

export interface TraceHop {
  label: string;
  timestamp: string;
  elapsed: number;
}

export interface TraceReport {
  generatedAt: string;
  entries: TraceEntry[];
}

export function buildTraceEntry(
  url: string,
  traceId: string,
  startedAt: Date,
  duration: number,
  statusCode: number | null,
  hops: TraceHop[]
): TraceEntry {
  return { url, traceId, startedAt: startedAt.toISOString(), duration, statusCode, hops };
}

export function buildTraceReport(entries: TraceEntry[]): TraceReport {
  return { generatedAt: new Date().toISOString(), entries };
}

export function traceToJson(report: TraceReport): string {
  return JSON.stringify(report, null, 2);
}

export function formatTraceReport(report: TraceReport): string {
  const lines: string[] = [`Trace Report — ${report.generatedAt}`, ""];
  for (const e of report.entries) {
    lines.push(`[${e.traceId}] ${e.url}`);
    lines.push(`  Status: ${e.statusCode ?? "N/A"}  Duration: ${e.duration}ms`);
    for (const h of e.hops) {
      lines.push(`  -> ${h.label} @ ${h.timestamp} (+${h.elapsed}ms)`);
    }
    lines.push("");
  }
  return lines.join("\n");
}
