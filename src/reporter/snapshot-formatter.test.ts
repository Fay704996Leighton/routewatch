import { diffSnapshots, formatSnapshotDiff, snapshotDiffToJson, formatSnapshotEntry } from "./snapshot-formatter";
import { SnapshotFile, buildSnapshotEntry } from "../monitor/snapshot";

function makeSnap(entries: ReturnType<typeof buildSnapshotEntry>[]): SnapshotFile {
  return { version: 1, entries };
}

describe("diffSnapshots", () => {
  it("returns empty when snapshots match", () => {
    const e = buildSnapshotEntry("https://api.test", 200, { ok: true }, {});
    const snap = makeSnap([e]);
    expect(diffSnapshots(snap, snap)).toHaveLength(0);
  });

  it("detects statusCode change", () => {
    const prev = makeSnap([buildSnapshotEntry("https://api.test", 200, {}, {})]);
    const curr = makeSnap([buildSnapshotEntry("https://api.test", 500, {}, {})]);
    const diffs = diffSnapshots(prev, curr);
    expect(diffs).toHaveLength(1);
    expect(diffs[0].field).toBe("statusCode");
    expect(diffs[0].previous).toBe(200);
    expect(diffs[0].current).toBe(500);
  });

  it("detects body change", () => {
    const prev = makeSnap([buildSnapshotEntry("https://api.test", 200, { v: 1 }, {})]);
    const curr = makeSnap([buildSnapshotEntry("https://api.test", 200, { v: 2 }, {})]);
    const diffs = diffSnapshots(prev, curr);
    expect(diffs.some((d) => d.field === "body")).toBe(true);
  });

  it("ignores new urls with no previous entry", () => {
    const prev = makeSnap([]);
    const curr = makeSnap([buildSnapshotEntry("https://new.test", 200, {}, {})]);
    expect(diffSnapshots(prev, curr)).toHaveLength(0);
  });
});

describe("formatSnapshotDiff", () => {
  it("returns no-change message when empty", () => {
    expect(formatSnapshotDiff([])).toContain("No snapshot changes");
  });

  it("includes url and field in output", () => {
    const diffs = [{ url: "https://x.com", field: "statusCode" as const, previous: 200, current: 503 }];
    const out = formatSnapshotDiff(diffs);
    expect(out).toContain("https://x.com");
    expect(out).toContain("STATUSCODE");
  });
});

describe("snapshotDiffToJson", () => {
  it("returns valid JSON", () => {
    const json = snapshotDiffToJson([]);
    expect(() => JSON.parse(json)).not.toThrow();
  });
});

describe("formatSnapshotEntry", () => {
  it("includes url and status code", () => {
    const e = buildSnapshotEntry("https://api.test/health", 200, {}, {});
    const out = formatSnapshotEntry(e);
    expect(out).toContain("https://api.test/health");
    expect(out).toContain("200");
  });
});
