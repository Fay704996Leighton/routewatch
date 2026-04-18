import { describe, it, expect } from "vitest";
import {
  buildStaleEntry,
  buildStaleReport,
  formatStaleReport,
  staleToJson,
} from "./stale";

const NOW = 1_700_000_000_000;

describe("buildStaleEntry", () => {
  it("marks entry as stale when beyond threshold", () => {
    const entry = buildStaleEntry("https://api.example.com/health", NOW - 60_000, 30_000, NOW);
    expect(entry.isStale).toBe(true);
    expect(entry.staleSinceMs).toBe(60_000);
  });

  it("marks entry as not stale when within threshold", () => {
    const entry = buildStaleEntry("https://api.example.com/health", NOW - 10_000, 30_000, NOW);
    expect(entry.isStale).toBe(false);
  });

  it("includes url and lastSeenAt", () => {
    const entry = buildStaleEntry("https://x.com", NOW - 5_000, 60_000, NOW);
    expect(entry.url).toBe("https://x.com");
    expect(entry.lastSeenAt).toBe(NOW - 5_000);
  });
});

describe("buildStaleReport", () => {
  it("counts stale entries correctly", () => {
    const entries = [
      buildStaleEntry("https://a.com", NOW - 60_000, 30_000, NOW),
      buildStaleEntry("https://b.com", NOW - 5_000, 30_000, NOW),
    ];
    const report = buildStaleReport(entries, NOW);
    expect(report.staleCount).toBe(1);
    expect(report.entries).toHaveLength(2);
  });

  it("includes generatedAt", () => {
    const report = buildStaleReport([], NOW);
    expect(report.generatedAt).toBe(new Date(NOW).toISOString());
  });
});

describe("formatStaleReport", () => {
  it("includes STALE tag for stale entries", () => {
    const entries = [buildStaleEntry("https://a.com", NOW - 60_000, 30_000, NOW)];
    const report = buildStaleReport(entries, NOW);
    const text = formatStaleReport(report);
    expect(text).toContain("[STALE]");
    expect(text).toContain("https://a.com");
  });

  it("includes ok tag for fresh entries", () => {
    const entries = [buildStaleEntry("https://b.com", NOW - 1_000, 30_000, NOW)];
    const report = buildStaleReport(entries, NOW);
    expect(formatStaleReport(report)).toContain("[ok]");
  });
});

describe("staleToJson", () => {
  it("returns valid JSON", () => {
    const report = buildStaleReport([], NOW);
    const json = JSON.parse(staleToJson(report));
    expect(json.staleCount).toBe(0);
  });
});
