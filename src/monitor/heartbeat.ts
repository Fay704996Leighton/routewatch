import type { PollResult } from "./types";

export interface HeartbeatEntry {
  url: string;
  lastSeen: string;
  intervalMs: number;
  missed: number;
  status: "ok" | "missed" | "dead";
}

export interface HeartbeatReport {
  generatedAt: string;
  entries: HeartbeatEntry[];
}

export function buildHeartbeatEntry(
  url: string,
  results: PollResult[],
  expectedIntervalMs: number,
  nowMs: number = Date.now()
): HeartbeatEntry {
  const successes = results.filter((r) => r.status === "success");
  if (successes.length === 0) {
    return { url, lastSeen: "never", intervalMs: expectedIntervalMs, missed: 0, status: "dead" };
  }

  const timestamps = successes.map((r) => new Date(r.timestamp).getTime()).sort((a, b) => b - a);
  const lastSeen = new Date(timestamps[0]).toISOString();
  const elapsed = nowMs - timestamps[0];
  const missed = Math.max(0, Math.floor(elapsed / expectedIntervalMs) - 1);
  const status = missed === 0 ? "ok" : missed >= 3 ? "dead" : "missed";

  return { url, lastSeen, intervalMs: expectedIntervalMs, missed, status };
}

export function buildHeartbeatReport(
  results: PollResult[],
  expectedIntervalMs: number,
  nowMs: number = Date.now()
): HeartbeatReport {
  const byUrl = new Map<string, PollResult[]>();
  for (const r of results) {
    if (!byUrl.has(r.url)) byUrl.set(r.url, []);
    byUrl.get(r.url)!.push(r);
  }

  const entries = Array.from(byUrl.entries()).map(([url, rs]) =>
    buildHeartbeatEntry(url, rs, expectedIntervalMs, nowMs)
  );

  return { generatedAt: new Date(nowMs).toISOString(), entries };
}

export function heartbeatToJson(report: HeartbeatReport): string {
  return JSON.stringify(report, null, 2);
}

export function formatHeartbeatReport(report: HeartbeatReport): string {
  const lines: string[] = [`Heartbeat Report — ${report.generatedAt}`, ""];
  for (const e of report.entries) {
    const icon = e.status === "ok" ? "✓" : e.status === "missed" ? "!" : "✗";
    lines.push(`${icon} ${e.url}`);
    lines.push(`  Last seen : ${e.lastSeen}`);
    lines.push(`  Missed    : ${e.missed}`);
    lines.push(`  Status    : ${e.status}`);
    lines.push("");
  }
  return lines.join("\n");
}
