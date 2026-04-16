import * as fs from "fs";
import * as path from "path";
import { PollResult } from "./types";

export interface HistoryEntry {
  timestamp: string;
  url: string;
  statusCode: number | null;
  durationMs: number;
  ok: boolean;
}

export interface HistoryStore {
  entries: HistoryEntry[];
}

export function toHistoryEntry(result: PollResult): HistoryEntry {
  return {
    timestamp: new Date().toISOString(),
    url: result.url,
    statusCode: result.statusCode ?? null,
    durationMs: result.durationMs,
    ok: result.ok,
  };
}

export function loadHistory(filePath: string): HistoryStore {
  if (!fs.existsSync(filePath)) return { entries: [] };
  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(raw) as HistoryStore;
  } catch {
    return { entries: [] };
  }
}

export function appendHistory(
  filePath: string,
  results: PollResult[],
  maxEntries = 1000
): HistoryStore {
  const store = loadHistory(filePath);
  const newEntries = results.map(toHistoryEntry);
  store.entries = [...store.entries, ...newEntries].slice(-maxEntries);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(store, null, 2), "utf-8");
  return store;
}

export function queryHistory(
  store: HistoryStore,
  url: string,
  limit = 50
): HistoryEntry[] {
  return store.entries.filter((e) => e.url === url).slice(-limit);
}
