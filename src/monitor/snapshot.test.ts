import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import {
  buildSnapshotEntry,
  loadSnapshot,
  saveSnapshot,
  upsertSnapshotEntry,
  findSnapshotEntry,
} from "./snapshot";

function tmpFile(): string {
  return path.join(os.tmpdir(), `snapshot-test-${Date.now()}.json`);
}

describe("buildSnapshotEntry", () => {
  it("creates entry with expected fields", () => {
    const entry = buildSnapshotEntry("https://api.example.com/users", 200, { ok: true }, { "content-type": "application/json" });
    expect(entry.url).toBe("https://api.example.com/users");
    expect(entry.statusCode).toBe(200);
    expect(entry.body).toEqual({ ok: true });
    expect(entry.capturedAt).toBeDefined();
  });
});

describe("loadSnapshot", () => {
  it("returns empty snapshot if file missing", () => {
    const result = loadSnapshot("/nonexistent/path/snap.json");
    expect(result.version).toBe(1);
    expect(result.entries).toEqual([]);
  });

  it("loads existing snapshot", () => {
    const file = tmpFile();
    const snap = { version: 1 as const, entries: [buildSnapshotEntry("https://x.com", 200, {}, {})] };
    fs.writeFileSync(file, JSON.stringify(snap));
    const loaded = loadSnapshot(file);
    expect(loaded.entries).toHaveLength(1);
    fs.unlinkSync(file);
  });
});

describe("saveSnapshot / loadSnapshot roundtrip", () => {
  it("persists and reloads", () => {
    const file = tmpFile();
    const entry = buildSnapshotEntry("https://api.test/items", 200, [1, 2], {});
    const snap = upsertSnapshotEntry({ version: 1, entries: [] }, entry);
    saveSnapshot(file, snap);
    const loaded = loadSnapshot(file);
    expect(loaded.entries).toHaveLength(1);
    expect(loaded.entries[0].url).toBe("https://api.test/items");
    fs.unlinkSync(file);
  });
});

describe("upsertSnapshotEntry", () => {
  it("replaces existing entry for same url", () => {
    const e1 = buildSnapshotEntry("https://a.com", 200, { v: 1 }, {});
    const e2 = buildSnapshotEntry("https://a.com", 200, { v: 2 }, {});
    let snap = upsertSnapshotEntry({ version: 1, entries: [] }, e1);
    snap = upsertSnapshotEntry(snap, e2);
    expect(snap.entries).toHaveLength(1);
    expect((snap.entries[0].body as any).v).toBe(2);
  });
});

describe("findSnapshotEntry", () => {
  it("returns undefined for missing url", () => {
    expect(findSnapshotEntry({ version: 1, entries: [] }, "https://nope.com")).toBeUndefined();
  });

  it("finds entry by url", () => {
    const entry = buildSnapshotEntry("https://found.com", 200, {}, {});
    const snap = upsertSnapshotEntry({ version: 1, entries: [] }, entry);
    expect(findSnapshotEntry(snap, "https://found.com")).toBeDefined();
  });
});
