import { computeJitterEntry, buildJitterReport, jitterToJson, formatJitterReport } from "./jitter";
import type { PollResult } from "./types";

function makePollResult(url: string, duration: number, status = 200): PollResult {
  return {
    url,
    status,
    duration,
    timestamp: new Date().toISOString(),
    body: null,
    error: null,
  };
}

describe("computeJitterEntry", () => {
  it("returns zero jitter for constant durations", () => {
    const results = [100, 100, 100, 100].map((d) => makePollResult("http://a.com", d));
    const entry = computeJitterEntry("http://a.com", results);
    expect(entry.stddev).toBe(0);
    expect(entry.mean).toBe(100);
    expect(entry.min).toBe(100);
    expect(entry.max).toBe(100);
  });

  it("computes correct stddev for varying durations", () => {
    const results = [100, 200, 300].map((d) => makePollResult("http://b.com", d));
    const entry = computeJitterEntry("http://b.com", results);
    expect(entry.mean).toBe(200);
    expect(entry.min).toBe(100);
    expect(entry.max).toBe(300);
    expect(entry.stddev).toBeGreaterThan(0);
  });

  it("handles a single result", () => {
    const results = [makePollResult("http://c.com", 150)];
    const entry = computeJitterEntry("http://c.com", results);
    expect(entry.mean).toBe(150);
    expect(entry.stddev).toBe(0);
    expect(entry.sampleCount).toBe(1);
  });

  it("sets url correctly", () => {
    const results = [makePollResult("http://d.com", 120)];
    const entry = computeJitterEntry("http://d.com", results);
    expect(entry.url).toBe("http://d.com");
  });
});

describe("buildJitterReport", () => {
  it("groups results by url", () => {
    const results = [
      makePollResult("http://a.com", 100),
      makePollResult("http://a.com", 200),
      makePollResult("http://b.com", 300),
    ];
    const report = buildJitterReport(results);
    expect(report.entries).toHaveLength(2);
    const urls = report.entries.map((e) => e.url);
    expect(urls).toContain("http://a.com");
    expect(urls).toContain("http://b.com");
  });

  it("returns empty entries for empty input", () => {
    const report = buildJitterReport([]);
    expect(report.entries).toHaveLength(0);
  });
});

describe("jitterToJson", () => {
  it("serializes to JSON string", () => {
    const results = [makePollResult("http://a.com", 100)];
    const report = buildJitterReport(results);
    const json = jitterToJson(report);
    const parsed = JSON.parse(json);
    expect(parsed.entries).toHaveLength(1);
  });
});

describe("formatJitterReport", () => {
  it("returns a non-empty string", () => {
    const results = [makePollResult("http://a.com", 100), makePollResult("http://a.com", 200)];
    const report = buildJitterReport(results);
    const text = formatJitterReport(report);
    expect(typeof text).toBe("string");
    expect(text.length).toBeGreaterThan(0);
    expect(text).toContain("http://a.com");
  });
});
