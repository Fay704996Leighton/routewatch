import {
  buildDriftEntry,
  buildDriftReport,
  computeDriftScore,
  formatDriftReport,
  driftReportToJson,
} from "./drift-tracker";
import { SchemaDriftResult } from "./types";

function makeDrift(added: string[], removed: string[]): SchemaDriftResult {
  return { hasDrift: added.length > 0 || removed.length > 0, addedKeys: added, removedKeys: removed };
}

describe("computeDriftScore", () => {
  it("returns 0 for no drift", () => {
    expect(computeDriftScore([], [])).toBe(0);
  });

  it("weights removals double", () => {
    expect(computeDriftScore(["a"], ["b", "c"])).toBe(1 + 4);
  });
});

describe("buildDriftEntry", () => {
  it("builds entry from drift result", () => {
    const entry = buildDriftEntry("https://api.test/users", makeDrift(["id"], ["name"]));
    expect(entry.url).toBe("https://api.test/users");
    expect(entry.addedKeys).toEqual(["id"]);
    expect(entry.removedKeys).toEqual(["name"]);
    expect(entry.driftScore).toBe(3);
    expect(entry.checkedAt).toBeTruthy();
  });
});

describe("buildDriftReport", () => {
  it("identifies most volatile url", () => {
    const entries = [
      buildDriftEntry("https://a.test", makeDrift(["x"], [])),
      buildDriftEntry("https://b.test", makeDrift(["x", "y"], ["z"])),
    ];
    const report = buildDriftReport(entries);
    expect(report.totalDrifted).toBe(2);
    expect(report.mostVolatile).toBe("https://b.test");
  });

  it("handles no drift", () => {
    const entries = [buildDriftEntry("https://a.test", makeDrift([], []))];
    const report = buildDriftReport(entries);
    expect(report.totalDrifted).toBe(0);
    expect(report.mostVolatile).toBeNull();
  });
});

describe("formatDriftReport", () => {
  it("includes header and drift info", () => {
    const entries = [buildDriftEntry("https://api.test", makeDrift(["newField"], ["oldField"]))];
    const report = buildDriftReport(entries);
    const text = formatDriftReport(report);
    expect(text).toContain("Schema Drift Report");
    expect(text).toContain("https://api.test");
    expect(text).toContain("newField");
    expect(text).toContain("oldField");
  });
});

describe("driftReportToJson", () => {
  it("returns valid JSON", () => {
    const report = buildDriftReport([]);
    const json = driftReportToJson(report);
    expect(() => JSON.parse(json)).not.toThrow();
  });
});
