import type { HeartbeatReport, HeartbeatEntry } from "../monitor/heartbeat";

const STATUS_ICON: Record<HeartbeatEntry["status"], string> = {
  ok: "✓",
  missed: "!",
  dead: "✗",
};

export function formatHeartbeatEntry(entry: HeartbeatEntry): string {
  const icon = STATUS_ICON[entry.status];
  return [
    `${icon} [${entry.status.toUpperCase()}] ${entry.url}`,
    `  Last seen : ${entry.lastSeen}`,
    `  Interval  : ${entry.intervalMs}ms`,
    `  Missed    : ${entry.missed}`,
  ].join("\n");
}

export function formatHeartbeatReportText(report: HeartbeatReport): string {
  const header = `=== Heartbeat Report === ${report.generatedAt}`;
  const body = report.entries.map(formatHeartbeatEntry).join("\n\n");
  const dead = report.entries.filter((e) => e.status === "dead").length;
  const missed = report.entries.filter((e) => e.status === "missed").length;
  const ok = report.entries.filter((e) => e.status === "ok").length;
  const summary = `Summary: ${ok} ok, ${missed} missed, ${dead} dead`;
  return [header, "", body, "", summary].join("\n");
}

export function heartbeatReportToJson(report: HeartbeatReport): string {
  return JSON.stringify(report, null, 2);
}

export function heartbeatSummaryLine(report: HeartbeatReport): string {
  const total = report.entries.length;
  const dead = report.entries.filter((e) => e.status === "dead").length;
  const missed = report.entries.filter((e) => e.status === "missed").length;
  if (dead > 0) return `CRITICAL: ${dead}/${total} endpoints dead`;
  if (missed > 0) return `WARNING: ${missed}/${total} endpoints missing heartbeats`;
  return `OK: all ${total} endpoints healthy`;
}
