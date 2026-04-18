import * as fs from "fs";
import * as path from "path";

export interface SnapshotEntry {
  url: string;
  capturedAt: string;
  statusCode: number;
  body: unknown;
  headers: Record<string, string>;
}

export interface SnapshotFile {
  version: 1;
  entries: SnapshotEntry[];
}

export function buildSnapshotEntry(
  url: string,
  statusCode: number,
  body: unknown,
  headers: Record<string, string>
): SnapshotEntry {
  return {
    url,
    capturedAt: new Date().toISOString(),
    statusCode,
    body,
    headers,
  };
}

export function loadSnapshot(filePath: string): SnapshotFile {
  if (!fs.existsSync(filePath)) {
    return { version: 1, entries: [] };
  }
  const raw = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(raw) as SnapshotFile;
}

export function saveSnapshot(filePath: string, snapshot: SnapshotFile): void {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(snapshot, null, 2), "utf-8");
}

export function upsertSnapshotEntry(
  snapshot: SnapshotFile,
  entry: SnapshotEntry
): SnapshotFile {
  const entries = snapshot.entries.filter((e) => e.url !== entry.url);
  return { ...snapshot, entries: [...entries, entry] };
}

export function findSnapshotEntry(
  snapshot: SnapshotFile,
  url: string
): SnapshotEntry | undefined {
  return snapshot.entries.find((e) => e.url === url);
}
