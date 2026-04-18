import { CheckpointFile, CheckpointEntry } from "../monitor/checkpoint";

export function formatCheckpointEntry(e: CheckpointEntry): string {
  const status = e.lastStatus !== null ? String(e.lastStatus) : "N/A";
  const failures =
    e.consecutiveFailures > 0
      ? ` | failures: ${e.consecutiveFailures}`
      : "";
  const success = e.lastSuccessAt
    ? ` | last ok: ${e.lastSuccessAt}`
    : " | last ok: never";
  return `[${e.lastChecked}] ${e.url} → ${status}${failures}${success}`;
}

export function formatCheckpointReport(cp: CheckpointFile): string {
  if (cp.entries.length === 0) {
    return `Checkpoint report (${cp.updatedAt})\nNo entries recorded.`;
  }
  const lines = cp.entries.map(formatCheckpointEntry);
  return `Checkpoint report (${cp.updatedAt})\n${lines.join("\n")}`;
}

export function checkpointToJson(cp: CheckpointFile): string {
  return JSON.stringify(
    {
      updatedAt: cp.updatedAt,
      total: cp.entries.length,
      failing: cp.entries.filter((e) => e.consecutiveFailures > 0).length,
      entries: cp.entries,
    },
    null,
    2
  );
}
