import { describe, it, expect } from "vitest";
import { formatStaleEntry, formatStaleReportText, staleSummaryLine } from "./stale-formatter";
import { buildStaleEntry, buildStaleReport } from "../monitor/stale";

const NOW = 1_700_000_000_000;

function makeEntry(isStale: boolean) {
  return buildStaleEntry(
    "https://api.example.com/v1/status",
    isStale ? NOW - 90_000 : NOW - 5_000,
    60_000,
    NOW
  );
}

describe("formatStaleEntry", () => {
  it("shows STALE for stale entry", () => {
    const text = formatStaleEntry(makeEntry(true));
    expect(text).toContain("[STALE]");
    expect(text).toContain("age=");
  });

  it("shows ok for fresh entry", () => {
    const text = formatStaleEntry(makeEntry(false));
    expect(text).toContain("[ok]");
  });

  it("includes url", () => {
    const text = formatStaleEntry(makeEntry(false));
    expect(text).toContain("https://api.example.com/v1/status");
  });
});

describe("formatStaleReportText", () => {
  it("includes header and counts", () => {
    const entries = [makeEntry(true), makeEntry(false)];
    const report = buildStaleReport(entries, NOW);
    const text = formatStaleReportText(report);
    expect(text).toContain("Stale Route Report");
    expect(text).toContain("1 / 2");
  });
});

describe("staleSummaryLine", () => {
  it("returns a one-line summary", () => {
    const report = buildStaleReport([makeEntry(true)], NOW);
    const line = staleSummaryLine(report);
    expect(line).toContain("stale-routes");
    expect(line).toContain("1 stale of 1 total");
  });
});
