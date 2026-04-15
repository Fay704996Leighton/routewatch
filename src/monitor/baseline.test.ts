import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import {
  loadBaseline,
  saveBaseline,
  buildBaselineEntry,
  updateBaseline,
  BaselineStore,
} from "./baseline";
import { PollResult } from "./types";

function makePollResult(url: string, durationMs: number): PollResult {
  return { url, status: 200, durationMs, body: "{}", timestamp: new Date().toISOString() };
}

function tmpFile(): string {
  return path.join(os.tmpdir(), `baseline-${Date.now()}.json`);
}

describe("loadBaseline", () => {
  it("returns empty store when file does not exist", () => {
    const store = loadBaseline("/nonexistent/path/baseline.json");
    expect(store.version).toBe(1);
    expect(store.entries).toEqual({});
  });

  it("reads existing baseline file", () => {
    const file = tmpFile();
    const data: BaselineStore = { version: 1, entries: { "http://a.com": { url: "http://a.com", avgDuration: 100, p95Duration: 150, sampleCount: 10, recordedAt: "2024-01-01T00:00:00.000Z" } } };
    fs.writeFileSync(file, JSON.stringify(data));
    const store = loadBaseline(file);
    expect(store.entries["http://a.com"].avgDuration).toBe(100);
    fs.unlinkSync(file);
  });
});

describe("saveBaseline", () => {
  it("writes baseline to disk and can be re-read", () => {
    const file = tmpFile();
    const store: BaselineStore = { version: 1, entries: {} };
    saveBaseline(file, store);
    const loaded = loadBaseline(file);
    expect(loaded.version).toBe(1);
    fs.unlinkSync(file);
  });
});

describe("buildBaselineEntry", () => {
  it("returns null for empty results", () => {
    expect(buildBaselineEntry([])).toBeNull();
  });

  it("computes avg and p95 from results", () => {
    const results = [100, 200, 150, 300, 250].map((d) => makePollResult("http://api.test", d));
    const entry = buildBaselineEntry(results);
    expect(entry).not.toBeNull();
    expect(entry!.url).toBe("http://api.test");
    expect(entry!.avgDuration).toBe(200);
    expect(entry!.sampleCount).toBe(5);
  });
});

describe("updateBaseline", () => {
  it("adds a new entry to the store", () => {
    const store: BaselineStore = { version: 1, entries: {} };
    const entry = { url: "http://x.com", avgDuration: 80, p95Duration: 120, sampleCount: 5, recordedAt: "now" };
    const updated = updateBaseline(store, entry);
    expect(updated.entries["http://x.com"]).toEqual(entry);
  });

  it("does not mutate the original store", () => {
    const store: BaselineStore = { version: 1, entries: {} };
    const entry = { url: "http://x.com", avgDuration: 80, p95Duration: 120, sampleCount: 5, recordedAt: "now" };
    updateBaseline(store, entry);
    expect(store.entries).toEqual({});
  });
});
