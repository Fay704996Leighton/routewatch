import { describe, it, expect } from "vitest";
import {
  buildHeatmapEntry,
  buildHeatmapReport,
  formatHeatmapReport,
  heatmapToJson,
} from "./heatmap";
import type { PollResult } from "./types";

function makeResult(
  url: string,
  status: PollResult["status"],
  duration: number,
  isoTimestamp: string
): PollResult {
  return { url, status, duration, timestamp: isoTimestamp, statusCode: status === "success" ? 200 : 500 };
}

// Monday 09:00 UTC
const MON_9 = "2024-01-08T09:00:00.000Z";
// Monday 09:30 UTC
const MON_9B = "2024-01-08T09:30:00.000Z";
// Tuesday 14:00 UTC
const TUE_14 = "2024-01-09T14:00:00.000Z";

describe("buildHeatmapEntry", () => {
  it("groups results by day and hour", () => {
    const results: PollResult[] = [
      makeResult("http://a.com", "success", 100, MON_9),
      makeResult("http://a.com", "success", 200, MON_9B),
      makeResult("http://a.com", "error", 0, TUE_14),
    ];
    const entry = buildHeatmapEntry("http://a.com", results);
    expect(entry.url).toBe("http://a.com");
    expect(entry.cells).toHaveLength(2);

    const mon = entry.cells.find((c) => c.day === 1 && c.hour === 9);
    expect(mon).toBeDefined();
    expect(mon!.count).toBe(2);
    expect(mon!.avgDuration).toBe(150);
    expect(mon!.errorRate).toBe(0);

    const tue = entry.cells.find((c) => c.day === 2 && c.hour === 14);
    expect(tue).toBeDefined();
    expect(tue!.count).toBe(1);
    expect(tue!.errorRate).toBe(1);
  });

  it("returns empty cells for empty results", () => {
    const entry = buildHeatmapEntry("http://b.com", []);
    expect(entry.cells).toHaveLength(0);
  });

  it("sorts cells by day then hour", () => {
    const results: PollResult[] = [
      makeResult("http://a.com", "success", 50, TUE_14),
      makeResult("http://a.com", "success", 50, MON_9),
    ];
    const entry = buildHeatmapEntry("http://a.com", results);
    expect(entry.cells[0].day).toBeLessThanOrEqual(entry.cells[1].day);
  });
});

describe("buildHeatmapReport", () => {
  it("groups results by URL", () => {
    const results: PollResult[] = [
      makeResult("http://a.com", "success", 100, MON_9),
      makeResult("http://b.com", "success", 200, TUE_14),
    ];
    const report = buildHeatmapReport(results);
    expect(report.entries).toHaveLength(2);
    expect(report.entries.map((e) => e.url).sort()).toEqual(
      ["http://a.com", "http://b.com"]
    );
  });

  it("includes generatedAt timestamp", () => {
    const report = buildHeatmapReport([]);
    expect(report.generatedAt).toMatch(/^\d{4}-/);
  });
});

describe("formatHeatmapReport", () => {
  it("includes URL and cell data in text output", () => {
    const results: PollResult[] = [
      makeResult("http://a.com", "success", 120, MON_9),
    ];
    const report = buildHeatmapReport(results);
    const text = formatHeatmapReport(report);
    expect(text).toContain("http://a.com");
    expect(text).toContain("Mon");
    expect(text).toContain("120ms");
  });
});

describe("heatmapToJson", () => {
  it("produces valid JSON", () => {
    const report = buildHeatmapReport([]);
    const json = heatmapToJson(report);
    expect(() => JSON.parse(json)).not.toThrow();
  });
});
