import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import {
  loadHistory,
  appendHistory,
  queryHistory,
  toHistoryEntry,
} from "./history";
import { PollResult } from "./types";

function tmpFile(): string {
  return path.join(os.tmpdir(), `history-test-${Date.now()}.json`);
}

function makePollResult(url: string, ok = true, durationMs = 120): PollResult {
  return { url, ok, durationMs, statusCode: ok ? 200 : 500, body: "{}" };
}

describe("toHistoryEntry", () => {
  it("maps a PollResult to a HistoryEntry", () => {
    const entry = toHistoryEntry(makePollResult("http://a.com"));
    expect(entry.url).toBe("http://a.com");
    expect(entry.ok).toBe(true);
    expect(entry.statusCode).toBe(200);
    expect(entry.durationMs).toBe(120);
    expect(entry.timestamp).toBeDefined();
  });
});

describe("loadHistory", () => {
  it("returns empty store for missing file", () => {
    const store = loadHistory("/tmp/nonexistent-xyz.json");
    expect(store.entries).toEqual([]);
  });

  it("returns empty store for corrupt file", () => {
    const f = tmpFile();
    fs.writeFileSync(f, "not json");
    expect(loadHistory(f).entries).toEqual([]);
    fs.unlinkSync(f);
  });
});

describe("appendHistory", () => {
  it("appends results and persists to disk", () => {
    const f = tmpFile();
    const results = [makePollResult("http://x.com"), makePollResult("http://y.com", false)];
    const store = appendHistory(f, results);
    expect(store.entries).toHaveLength(2);
    const reloaded = loadHistory(f);
    expect(reloaded.entries).toHaveLength(2);
    fs.unlinkSync(f);
  });

  it("respects maxEntries cap", () => {
    const f = tmpFile();
    appendHistory(f, [makePollResult("http://a.com")], 2);
    appendHistory(f, [makePollResult("http://b.com")], 2);
    const store = appendHistory(f, [makePollResult("http://c.com")], 2);
    expect(store.entries).toHaveLength(2);
    fs.unlinkSync(f);
  });
});

describe("queryHistory", () => {
  it("filters by url", () => {
    const f = tmpFile();
    appendHistory(f, [makePollResult("http://a.com"), makePollResult("http://b.com")]);
    const store = loadHistory(f);
    const results = queryHistory(store, "http://a.com");
    expect(results).toHaveLength(1);
    expect(results[0].url).toBe("http://a.com");
    fs.unlinkSync(f);
  });
});
