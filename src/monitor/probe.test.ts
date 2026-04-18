import { buildProbeEntry, buildProbeReport, classifyProbe } from "./probe";
import { PollResult } from "./types";

function makeSuccess(url: string, durationMs: number): PollResult {
  return { kind: "success", url, durationMs, statusCode: 200, body: {} };
}

function makeError(url: string): PollResult {
  return { kind: "error", url, durationMs: 0, error: "ECONNREFUSED" };
}

function makeFailed(url: string, durationMs: number): PollResult {
  return { kind: "failed", url, durationMs, statusCode: 500, body: {} };
}

describe("classifyProbe", () => {
  it("returns reachable for fast success", () => {
    expect(classifyProbe(makeSuccess("http://a.com", 200))).toBe("reachable");
  });

  it("returns degraded when latency exceeds threshold", () => {
    expect(classifyProbe(makeSuccess("http://a.com", 1500))).toBe("degraded");
  });

  it("returns unreachable for error kind", () => {
    expect(classifyProbe(makeError("http://a.com"))).toBe("unreachable");
  });

  it("returns unreachable for failed kind", () => {
    expect(classifyProbe(makeFailed("http://a.com", 300))).toBe("unreachable");
  });
});

describe("buildProbeEntry", () => {
  it("includes statusCode for success", () => {
    const entry = buildProbeEntry(makeSuccess("http://a.com", 100));
    expect(entry.statusCode).toBe(200);
    expect(entry.error).toBeUndefined();
  });

  it("includes error for error kind", () => {
    const entry = buildProbeEntry(makeError("http://a.com"));
    expect(entry.error).toBe("ECONNREFUSED");
    expect(entry.statusCode).toBeUndefined();
  });
});

describe("buildProbeReport", () => {
  it("counts statuses correctly", () => {
    const results = [
      makeSuccess("http://a.com", 100),
      makeSuccess("http://b.com", 2000),
      makeError("http://c.com"),
    ];
    const report = buildProbeReport(results);
    expect(report.reachable).toBe(1);
    expect(report.degraded).toBe(1);
    expect(report.unreachable).toBe(1);
    expect(report.entries).toHaveLength(3);
  });

  it("respects custom degraded threshold", () => {
    const results = [makeSuccess("http://a.com", 500)];
    const report = buildProbeReport(results, 400);
    expect(report.degraded).toBe(1);
  });
});
