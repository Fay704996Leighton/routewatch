import * as fs from "fs";
import * as path from "path";

export interface CheckpointEntry {
  url: string;
  lastChecked: string; // ISO
  lastStatus: number | null;
  consecutiveFailures: number;
  lastSuccessAt: string | null;
}

export interface CheckpointFile {
  updatedAt: string;
  entries: CheckpointEntry[];
}

export function emptyCheckpoint(): CheckpointFile {
  return { updatedAt: new Date().toISOString(), entries: [] };
}

export function loadCheckpoint(filePath: string): CheckpointFile {
  if (!fs.existsSync(filePath)) return emptyCheckpoint();
  const raw = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(raw) as CheckpointFile;
}

export function saveCheckpoint(filePath: string, cp: CheckpointFile): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  cp.updatedAt = new Date().toISOString();
  fs.writeFileSync(filePath, JSON.stringify(cp, null, 2), "utf-8");
}

export function upsertCheckpointEntry(
  cp: CheckpointFile,
  entry: CheckpointEntry
): CheckpointFile {
  const idx = cp.entries.findIndex((e) => e.url === entry.url);
  if (idx === -1) {
    return { ...cp, entries: [...cp.entries, entry] };
  }
  const entries = [...cp.entries];
  entries[idx] = entry;
  return { ...cp, entries };
}

export function findCheckpointEntry(
  cp: CheckpointFile,
  url: string
): CheckpointEntry | undefined {
  return cp.entries.find((e) => e.url === url);
}

export function buildCheckpointEntry(
  url: string,
  status: number | null,
  prev: CheckpointEntry | undefined
): CheckpointEntry {
  const failed = status === null || status >= 500;
  return {
    url,
    lastChecked: new Date().toISOString(),
    lastStatus: status,
    consecutiveFailures: failed ? (prev?.consecutiveFailures ?? 0) + 1 : 0,
    lastSuccessAt: failed
      ? (prev?.lastSuccessAt ?? null)
      : new Date().toISOString(),
  };
}
