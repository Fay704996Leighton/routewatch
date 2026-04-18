import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import {
  loadCheckpoint,
  saveCheckpoint,
  emptyCheckpoint,
  upsertCheckpointEntry,
  findCheckpointEntry,
  buildCheckpointEntry,
} from "./checkpoint";

function tmpFile(): string {
  return path.join(os.tmpdir(), `cp-test-${Date.now()}.json`);
}

describe("checkpoint", () => {
  it("loadCheckpoint returns empty if file missing", () => {
    const cp = loadCheckpoint("/nonexistent/path/cp.json");
    expect(cp.entries).toHaveLength(0);
  });

  it("saveCheckpoint and loadCheckpoint round-trip", () => {
    const file = tmpFile();
    const cp = emptyCheckpoint();
    saveCheckpoint(file, cp);
    const loaded = loadCheckpoint(file);
    expect(loaded.entries).toHaveLength(0);
    fs.unlinkSync(file);
  });

  it("upsertCheckpointEntry inserts new entry", () => {
    const cp = emptyCheckpoint();
    const entry = buildCheckpointEntry("https://api.example.com", 200, undefined);
    const updated = upsertCheckpointEntry(cp, entry);
    expect(updated.entries).toHaveLength(1);
    expect(updated.entries[0].url).toBe("https://api.example.com");
  });

  it("upsertCheckpointEntry replaces existing entry", () => {
    let cp = emptyCheckpoint();
    const e1 = buildCheckpointEntry("https://api.example.com", 200, undefined);
    cp = upsertCheckpointEntry(cp, e1);
    const e2 = buildCheckpointEntry("https://api.example.com", 500, e1);
    cp = upsertCheckpointEntry(cp, e2);
    expect(cp.entries).toHaveLength(1);
    expect(cp.entries[0].lastStatus).toBe(500);
  });

  it("findCheckpointEntry returns undefined for unknown url", () => {
    const cp = emptyCheckpoint();
    expect(findCheckpointEntry(cp, "https://missing.com")).toBeUndefined();
  });

  it("buildCheckpointEntry increments consecutiveFailures on error", () => {
    const prev = buildCheckpointEntry("https://x.com", 500, undefined);
    expect(prev.consecutiveFailures).toBe(1);
    const next = buildCheckpointEntry("https://x.com", 503, prev);
    expect(next.consecutiveFailures).toBe(2);
  });

  it("buildCheckpointEntry resets failures on success", () => {
    const prev = buildCheckpointEntry("https://x.com", 500, undefined);
    const next = buildCheckpointEntry("https://x.com", 200, prev);
    expect(next.consecutiveFailures).toBe(0);
    expect(next.lastSuccessAt).not.toBeNull();
  });
});
