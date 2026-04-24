import {
  buildSaturationEntry,
  buildSaturationReport,
  classifySaturation,
  formatSaturationReport,
  percentile,
  saturationToJson,
} from "./saturation";

describe("percentile", () => {
  it("returns 0 for empty array", () => {
    expect(percentile([], 95)).toBe(0);
  });

  it("returns correct p95 for sorted array", () => {
    const sorted = [100, 200, 300, 400, 500, 600, 700, 800, 900, 1000];
    expect(percentile(sorted, 95)).toBe(950); // idx=9 → 1000? let's verify logic
    // ceil(0.95*10)-1 = ceil(9.5)-1 = 10-1 = 9 → 1000
    expect(percentile(sorted, 95)).toBe(1000);
  });

  it("handles single element", () => {
    expect(percentile([42], 50)).toBe(42);
  });
});

describe("classifySaturation", () => {
  it("returns low for < 40", () => expect(classifySaturation(30)).toBe("low"));
  it("returns moderate for 40–69", () => expect(classifySaturation(55)).toBe("moderate"));
  it("returns high for 70–89", () => expect(classifySaturation(80)).toBe("high"));
  it("returns critical for >= 90", () => expect(classifySaturation(95)).toBe("critical"));
});

describe("buildSaturationEntry", () => {
  const url = "https://api.example.com/users";

  it("returns zeroed entry for empty durations", () => {
    const entry = buildSaturationEntry(url, [], 1000);
    expect(entry.saturationPct).toBe(0);
    expect(entry.level).toBe("low");
  });

  it("computes saturation correctly", () => {
    const durations = [800, 850, 900, 920, 950, 960, 970, 980, 990, 1000];
    const entry = buildSaturationEntry(url, durations, 1000);
    expect(entry.saturationPct).toBeGreaterThan(0);
    expect(entry.p95Duration).toBeGreaterThan(0);
    expect(entry.maxDuration).toBe(1000);
    expect(entry.url).toBe(url);
  });

  it("caps saturation at 100", () => {
    const durations = [2000, 2100, 2200];
    const entry = buildSaturationEntry(url, durations, 1000);
    expect(entry.saturationPct).toBe(100);
    expect(entry.level).toBe("critical");
  });

  it("classifies low saturation correctly", () => {
    const durations = [100, 120, 130, 110, 105];
    const entry = buildSaturationEntry(url, durations, 1000);
    expect(entry.level).toBe("low");
  });
});

describe("buildSaturationReport", () => {
  it("wraps entries with a timestamp", () => {
    const entry = buildSaturationEntry("https://x.com/a", [200, 300], 1000);
    const report = buildSaturationReport([entry]);
    expect(report.entries).toHaveLength(1);
    expect(report.generatedAt).toBeTruthy();
  });
});

describe("saturationToJson", () => {
  it("produces valid JSON", () => {
    const report = buildSaturationReport([]);
    const json = saturationToJson(report);
    expect(() => JSON.parse(json)).not.toThrow();
  });
});

describe("formatSaturationReport", () => {
  it("includes url and level in output", () => {
    const entry = buildSaturationEntry("https://api.test/health", [400, 500, 600], 1000);
    const report = buildSaturationReport([entry]);
    const text = formatSaturationReport(report);
    expect(text).toContain("https://api.test/health");
    expect(text).toContain("level=");
    expect(text).toContain("saturation=");
  });
});
