import { PollResult } from "./types";
import { HistoryEntry } from "./history";

export interface ReplayEntry {
  url: string;
  timestamp: string;
  duration: number;
  status: number | null;
  ok: boolean;
  label?: string;
}

export interface ReplayReport {
  entries: ReplayEntry[];
  total: number;
  replayed: number;
  skipped: number;
}

export function toReplayEntry(h: HistoryEntry): ReplayEntry {
  return {
    url: h.url,
    timestamp: h.timestamp,
    duration: h.duration,
    status: h.status ?? null,
    ok: h.ok,
    label: h.label,
  };
}

export function buildReplayReport(
  entries: HistoryEntry[],
  fromTs: string,
  toTs?: string
): ReplayReport {
  const from = new Date(fromTs).getTime();
  const to = toTs ? new Date(toTs).getTime() : Date.now();

  const all = entries.map(toReplayEntry);
  const replayed = all.filter((e) => {
    const t = new Date(e.timestamp).getTime();
    return t >= from && t <= to;
  });
  const skipped = all.length - replayed.length;

  return { entries: replayed, total: all.length, replayed: replayed.length, skipped };
}

export function replayToJson(report: ReplayReport): string {
  return JSON.stringify(report, null, 2);
}

export function formatReplayReport(report: ReplayReport): string {
  const lines: string[] = [
    `Replay Report — ${report.replayed}/${report.total} entries (skipped: ${report.skipped})`,
    "-".repeat(60),
  ];
  for (const e of report.entries) {
    const label = e.label ? ` [${e.label}]` : "";
    const status = e.status !== null ? ` HTTP ${e.status}` : " no-response";
    lines.push(`${e.timestamp}${label} ${e.url}${status} ${e.duration}ms ${e.ok ? "OK" : "FAIL"}`);
  }
  return lines.join("\n");
}
