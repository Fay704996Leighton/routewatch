import { buildSampleWindow, buildSamplerReport, formatSamplerReport } from "./sampler";
import { PollResult } from "./types";

function makeResult(url: string, duration: number, status: "success" | "error" = "success"): PollResult {
  return { url, status, duration, timestamp: new Date().toISOString() } as PollResult;
}

describe("buildSampleWindow", () => {
  it("returns zeroed window for empty results", () => {
    const w = buildSampleWindow("http://a.com", []);
    expect(w.count).toBe(0);
    expect(w.mean).toBe(0);
    expect(w.p95).toBe(0);
  });

  it("computes stats correctly", () => {
    const results = [100, 200, 300, 400, 500].map((d) => makeResult("http://a.com", d));
    const w = buildSampleWindow("http://a.com", results);
    expect(w.count).toBe(5);
    expect(w.min).toBe(100);
    expect(w.max).toBe(500);
    expect(w.mean).toBe(300);
    expect(w.p95).toBe(500);
  });

  it("ignores non-success results", () => {
    const results = [
      makeResult("http://a.com", 100, "success"),
      makeResult("http://a.com", 999, "error"),
    ];
    const w = buildSampleWindow("http://a.com", results);
    expect(w.count).toBe(1);
    expect(w.max).toBe(100);
  });
});

describe("buildSamplerReport", () => {
  it("groups results by url", () => {
    const results = [
      makeResult("http://a.com", 100),
      makeResult("http://b.com", 200),
      makeResult("http://a.com", 150),
    ];
    const report = buildSamplerReport(results);
    expect(report).toHaveLength(2);
    const a = report.find((r) => r.url === "http://a.com");
    expect(a?.count).toBe(2);
  });
});

describe("formatSamplerReport", () => {
  it("returns message when empty", () => {
    expect(formatSamplerReport([])).toBe("No samples collected.");
  });

  it("formats entries", () => {
    const results = [makeResult("http://a.com", 100)];
    const report = buildSamplerReport(results);
    const text = formatSamplerReport(report);
    expect(text).toContain("http://a.com");
    expect(text).toContain("p95=");
  });
});
