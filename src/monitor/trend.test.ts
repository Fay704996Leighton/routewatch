import { computeSlope, classifySlope, buildTrendReport } from "./trend";
import { HistoryEntry } from "./history";

function makeEntry(route: string, avgDuration: number, ts = new Date().toISOString()): HistoryEntry {
  return { route, timestamp: ts, avgDuration, p95: avgDuration * 1.2, errorRate: 0, sampleCount: 5 };
}

describe("computeSlope", () => {
  it("returns 0 for single value", () => {
    expect(computeSlope([100])).toBe(0);
  });

  it("returns positive slope for increasing series", () => {
    const slope = computeSlope([100, 110, 120, 130, 140]);
    expect(slope).toBeCloseTo(10, 1);
  });

  it("returns negative slope for decreasing series", () => {
    const slope = computeSlope([140, 130, 120, 110, 100]);
    expect(slope).toBeCloseTo(-10, 1);
  });

  it("returns ~0 for flat series", () => {
    expect(computeSlope([100, 100, 100, 100])).toBeCloseTo(0);
  });
});

describe("classifySlope", () => {
  it("classifies degrading", () => {
    expect(classifySlope(10)).toBe("degrading");
  });

  it("classifies improving", () => {
    expect(classifySlope(-10)).toBe("improving");
  });

  it("classifies stable", () => {
    expect(classifySlope(2)).toBe("stable");
  });
});

describe("buildTrendReport", () => {
  it("groups by route and computes trend", () => {
    const history = [
      makeEntry("/api/a", 100),
      makeEntry("/api/a", 120),
      makeEntry("/api/a", 140),
      makeEntry("/api/b", 200),
      makeEntry("/api/b", 195),
    ];
    const report = buildTrendReport(history);
    expect(report.entries).toHaveLength(2);
    const a = report.entries.find(e => e.route === "/api/a")!;
    expect(a.direction).toBe("degrading");
    expect(a.sampleCount).toBe(3);
    const b = report.entries.find(e => e.route === "/api/b")!;
    expect(b.direction).toBe("stable");
  });

  it("returns empty entries for empty history", () => {
    const report = buildTrendReport([]);
    expect(report.entries).toHaveLength(0);
  });
});
