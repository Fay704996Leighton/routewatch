import { describe, it, expect } from "vitest";
import {
  buildTraceEntry,
  buildTraceReport,
  formatTraceReport,
  traceToJson,
  TraceHop,
} from "./trace";

const now = new Date("2024-01-01T00:00:00.000Z");

const hops: TraceHop[] = [
  { label: "dns", timestamp: now.toISOString(), elapsed: 5 },
  { label: "connect", timestamp: now.toISOString(), elapsed: 12 },
];

function makeEntry() {
  return buildTraceEntry("https://api.example.com/health", "abc-123", now, 120, 200, hops);
}

describe("buildTraceEntry", () => {
  it("captures all fields", () => {
    const e = makeEntry();
    expect(e.url).toBe("https://api.example.com/health");
    expect(e.traceId).toBe("abc-123");
    expect(e.duration).toBe(120);
    expect(e.statusCode).toBe(200);
    expect(e.hops).toHaveLength(2);
  });

  it("handles null status", () => {
    const e = buildTraceEntry("https://api.example.com", "x", now, 0, null, []);
    expect(e.statusCode).toBeNull();
  });
});

describe("buildTraceReport", () => {
  it("wraps entries with timestamp", () => {
    const r = buildTraceReport([makeEntry()]);
    expect(r.entries).toHaveLength(1);
    expect(r.generatedAt).toBeTruthy();
  });
});

describe("traceToJson", () => {
  it("produces valid JSON", () => {
    const r = buildTraceReport([makeEntry()]);
    const json = JSON.parse(traceToJson(r));
    expect(json.entries[0].traceId).toBe("abc-123");
  });
});

describe("formatTraceReport", () => {
  it("includes traceId and hops", () => {
    const r = buildTraceReport([makeEntry()]);
    const text = formatTraceReport(r);
    expect(text).toContain("abc-123");
    expect(text).toContain("dns");
    expect(text).toContain("connect");
  });

  it("shows N/A for null status", () => {
    const e = buildTraceEntry("https://x.com", "y", now, 0, null, []);
    const text = formatTraceReport(buildTraceReport([e]));
    expect(text).toContain("N/A");
  });
});
