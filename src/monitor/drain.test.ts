import {
  computeDrainRate,
  classifyDrainSeverity,
  buildDrainEntry,
  buildDrainReport,
  formatDrainReport,
  drainToJson,
} from "./drain";

describe("computeDrainRate", () => {
  it("returns 0 for single value", () => {
    expect(computeDrainRate([100])).toBe(0);
  });

  it("returns positive slope for increasing values", () => {
    const rate = computeDrainRate([100, 200, 300, 400]);
    expect(rate).toBeCloseTo(100, 0);
  });

  it("returns near-zero for flat values", () => {
    const rate = computeDrainRate([150, 150, 150, 150]);
    expect(rate).toBeCloseTo(0, 5);
  });

  it("returns negative slope for decreasing values", () => {
    const rate = computeDrainRate([400, 300, 200, 100]);
    expect(rate).toBeLessThan(0);
  });
});

describe("classifyDrainSeverity", () => {
  it("classifies high at >= 200", () => {
    expect(classifyDrainSeverity(200)).toBe("high");
    expect(classifyDrainSeverity(350)).toBe("high");
  });

  it("classifies medium between 80 and 199", () => {
    expect(classifyDrainSeverity(80)).toBe("medium");
    expect(classifyDrainSeverity(150)).toBe("medium");
  });

  it("classifies low below 80", () => {
    expect(classifyDrainSeverity(0)).toBe("low");
    expect(classifyDrainSeverity(79)).toBe("low");
  });
});

describe("buildDrainEntry", () => {
  it("marks draining when rate exceeds threshold", () => {
    const entry = buildDrainEntry("https://api.example.com/data", [100, 200, 300], 50);
    expect(entry.isDraining).toBe(true);
    expect(entry.drainRate).toBeGreaterThan(50);
    expect(entry.windowCount).toBe(3);
  });

  it("marks not draining when rate is below threshold", () => {
    const entry = buildDrainEntry("https://api.example.com/health", [120, 121, 119], 50);
    expect(entry.isDraining).toBe(false);
    expect(entry.severity).toBe("low");
  });
});

describe("buildDrainReport", () => {
  it("counts draining entries correctly", () => {
    const entries = [
      buildDrainEntry("https://a.com", [100, 200, 300], 50),
      buildDrainEntry("https://b.com", [100, 101, 100], 50),
    ];
    const report = buildDrainReport(entries);
    expect(report.drainingCount).toBe(1);
    expect(report.entries).toHaveLength(2);
    expect(report.generatedAt).toBeTruthy();
  });
});

describe("formatDrainReport", () => {
  it("includes drain rate and window count in output", () => {
    const entry = buildDrainEntry("https://api.example.com/slow", [100, 300, 500], 50);
    const report = buildDrainReport([entry]);
    const text = formatDrainReport(report);
    expect(text).toContain("https://api.example.com/slow");
    expect(text).toContain("drain_rate=");
    expect(text).toContain("windows=3");
  });
});

describe("drainToJson", () => {
  it("produces valid JSON", () => {
    const report = buildDrainReport([]);
    const json = drainToJson(report);
    expect(() => JSON.parse(json)).not.toThrow();
    expect(JSON.parse(json).drainingCount).toBe(0);
  });
});
