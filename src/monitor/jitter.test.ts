import { describe, it, expect } from "vitest";
import {
  computeJitterEntry,
  buildJitterReport,
  formatJitterReport,
  jitterToJson,
} from "./jitter";
import type { PollResult } from "./types";

function makePollResult(route: string, duration: number, status: "success" | "error" = "success"): PollResult {
  return { route, duration, status, timestamp: new Date().toISOString(), statusCode: 200 } as PollResult;
}

describe("computeJitterEntry", () => {
  it("returns zeros for empty durations", () => {
    const e = computeJitterEntry("/api", []);
    expect(e.jitter).toBe(0);
    expect(e.cv).toBe(0);
  });

  it("computes jitter correctly", () => {
    const e = computeJitterEntry("/api", [100, 200, 300]);
    expect(e.min).toBe(100);
    expect(e.max).toBe(300);
    expect(e.jitter).toBe(200);
    expect(e.mean).toBe(200);
  });

  it("computes cv", () => {
    const e = computeJitterEntry("/api", [100, 100, 100]);
    expect(e.cv).toBe(0);
  });
});

describe("buildJitterReport", () => {
  it("groups results by route", () => {
    const results = [
      makePollResult("/a", 100),
      makePollResult("/a", 300),
      makePollResult("/b", 50),
    ];
    const report = buildJitterReport(results);
    expect(report.entries).toHaveLength(2);
    const a = report.entries.find((e) => e.route === "/a")!;
    expect(a.jitter).toBe(200);
  });

  it("ignores error results", () => {
    const results = [
      makePollResult("/a", 100, "success"),
      makePollResult("/a", 999, "error"),
    ];
    const report = buildJitterReport(results);
    const a = report.entries.find((e) => e.route === "/a")!;
    expect(a.min).toBe(100);
    expect(a.max).toBe(100);
  });

  it("includes generatedAt", () => {
    const report = buildJitterReport([]);
    expect(report.generatedAt).toBeTruthy();
  });
});

describe("formatJitterReport", () => {
  it("returns a string with route info", () => {
    const report = buildJitterReport([makePollResult("/x", 120)]);
    const text = formatJitterReport(report);
    expect(text).toContain("/x");
    expect(text).toContain("jitter=");
  });
});

describe("jitterToJson", () => {
  it("serializes to valid JSON", () => {
    const report = buildJitterReport([makePollResult("/z", 80)]);
    const json = JSON.parse(jitterToJson(report));
    expect(json.entries).toHaveLength(1);
  });
});
