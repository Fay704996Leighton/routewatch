import { describe, it, expect } from "vitest";
import {
  formatTraceEntry,
  formatTraceReportText,
  traceSummaryLine,
  traceReportToJson,
} from "./trace-formatter";
import { buildTraceEntry, buildTraceReport, TraceHop } from "../monitor/trace";

const now = new Date("2024-06-01T12:00:00.000Z");
const hops: TraceHop[] = [
  { label: "dns", timestamp: now.toISOString(), elapsed: 3 },
  { label: "tls", timestamp: now.toISOString(), elapsed: 20 },
];

function makeEntry(duration = 200, status: number | null = 200) {
  return buildTraceEntry("https://api.test/v1", "tid-001", now, duration, status, hops);
}

describe("formatTraceEntry", () => {
  it("includes all key fields", () => {
    const text = formatTraceEntry(makeEntry());
    expect(text).toContain("tid-001");
    expect(text).toContain("200ms");
    expect(text).toContain("dns");
    expect(text).toContain("tls");
  });

  it("shows none when no hops", () => {
    const e = buildTraceEntry("https://x.com", "t2", now, 50, 200, []);
    expect(formatTraceEntry(e)).toContain("none");
  });

  it("shows N/A for null status", () => {
    expect(formatTraceEntry(makeEntry(100, null))).toContain("N/A");
  });
});

describe("formatTraceReportText", () => {
  it("renders header and entries", () => {
    const r = buildTraceReport([makeEntry()]);
    const text = formatTraceReportText(r);
    expect(text).toContain("Trace Report");
    expect(text).toContain("tid-001");
  });

  it("notes empty report", () => {
    const r = buildTraceReport([]);
    expect(formatTraceReportText(r)).toContain("No traces");
  });
});

describe("traceSummaryLine", () => {
  it("computes average duration", () => {
    const r = buildTraceReport([makeEntry(100), makeEntry(300)]);
    expect(traceSummaryLine(r)).toContain("200ms");
  });

  it("handles empty", () => {
    expect(traceSummaryLine(buildTraceReport([]))).toContain("0ms");
  });
});

describe("traceReportToJson", () => {
  it("is valid JSON with entries", () => {
    const r = buildTraceReport([makeEntry()]);
    const parsed = JSON.parse(traceReportToJson(r));
    expect(parsed.entries[0].traceId).toBe("tid-001");
  });
});
