import { SnapshotFile, SnapshotEntry } from "../monitor/snapshot";

export interface SnapshotDiff {
  url: string;
  field: "statusCode" | "body" | "headers";
  previous: unknown;
  current: unknown;
}

export function diffSnapshots(
  previous: SnapshotFile,
  current: SnapshotFile
): SnapshotDiff[] {
  const diffs: SnapshotDiff[] = [];
  for (const curr of current.entries) {
    const prev = previous.entries.find((e) => e.url === curr.url);
    if (!prev) continue;
    if (prev.statusCode !== curr.statusCode) {
      diffs.push({ url: curr.url, field: "statusCode", previous: prev.statusCode, current: curr.statusCode });
    }
    if (JSON.stringify(prev.body) !== JSON.stringify(curr.body)) {
      diffs.push({ url: curr.url, field: "body", previous: prev.body, current: curr.body });
    }
  }
  return diffs;
}

export function formatSnapshotDiff(diffs: SnapshotDiff[]): string {
  if (diffs.length === 0) return "No snapshot changes detected.";
  const lines = ["Snapshot Diff:", ""];
  for (const d of diffs) {
    lines.push(`  [${d.field.toUpperCase()}] ${d.url}`);
    lines.push(`    previous: ${JSON.stringify(d.previous)}`);
    lines.push(`    current:  ${JSON.stringify(d.current)}`);
  }
  return lines.join("\n");
}

export function snapshotDiffToJson(diffs: SnapshotDiff[]): string {
  return JSON.stringify({ diffs }, null, 2);
}

export function formatSnapshotEntry(entry: SnapshotEntry): string {
  return `[${entry.capturedAt}] ${entry.url} → HTTP ${entry.statusCode}`;
}
