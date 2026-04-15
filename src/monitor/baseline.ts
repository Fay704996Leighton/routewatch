import * as fs from "fs";
import * as path from "path";
import { PollResult } from "./types";

export interface BaselineEntry {
  url: string;
  avgDuration: number;
  p95Duration: number;
  sampleCount: number;
  recordedAt: string;
}

export interface BaselineStore {
  version: number;
  entries: Record<string, BaselineEntry>;
}

export function loadBaseline(filePath: string): BaselineStore {
  if (!fs.existsSync(filePath)) {
    return { version: 1, entries: {} };
  }
  const raw = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(raw) as BaselineStore;
}

export function saveBaseline(filePath: string, store: BaselineStore): void {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(filePath, JSON.stringify(store, null, 2), "utf-8");
}

export function buildBaselineEntry(results: PollResult[]): BaselineEntry | null {
  if (results.length === 0) return null;
  const url = results[0].url;
  const durations = results
    .filter((r) => r.durationMs !== undefined)
    .map((r) => r.durationMs as number)
    .sort((a, b) => a - b);
  if (durations.length === 0) return null;
  const avg = durations.reduce((s, d) => s + d, 0) / durations.length;
  const p95Index = Math.floor(durations.length * 0.95);
  const p95 = durations[Math.min(p95Index, durations.length - 1)];
  return {
    url,
    avgDuration: Math.round(avg),
    p95Duration: Math.round(p95),
    sampleCount: durations.length,
    recordedAt: new Date().toISOString(),
  };
}

export function updateBaseline(
  store: BaselineStore,
  entry: BaselineEntry
): BaselineStore {
  return {
    ...store,
    entries: {
      ...store.entries,
      [entry.url]: entry,
    },
  };
}
