import {
  classifyLatency,
  buildLatencyBandEntry,
  buildLatencyBandReport,
  DEFAULT_THRESHOLDS,
} from "./latency-band";

describe("classifyLatency", () => {
  it("returns fast for low values", () => {
    expect(classifyLatency(100)).toBe("fast");
  });

  it("returns normal for mid-range values", () => {
    expect(classifyLatency(350)).toBe("normal");
  });

  it("returns slow for high values", () => {
    expect(classifyLatency(900)).toBe("slow");
  });

  it("returns critical for very high values", () => {
    expect(classifyLatency(2000)).toBe("critical");
  });

  it("respects custom thresholds", () => {
    const t = { fast: 50, normal: 100, slow: 200 };
    expect(classifyLatency(60, t)).toBe("normal");
    expect(classifyLatency(250, t)).toBe("critical");
  });
});

describe("buildLatencyBandEntry", () => {
  it("computes average and band correctly", () => {
    const entry = buildLatencyBandEntry("https://api.example.com/health", [100, 200, 300]);
    expect(entry.url).toBe("https://api.example.com/health");
    expect(entry.avgMs).toBeCloseTo(200);
    expect(entry.band).toBe("normal");
  });

  it("handles empty durations", () => {
    const entry = buildLatencyBandEntry("https://api.example.com", []);
    expect(entry.avgMs).toBe(0);
    expect(entry.band).toBe("fast");
  });

  it("uses default thresholds when not provided", () => {
    const entry = buildLatencyBandEntry("https://x.com", [2000]);
    expect(entry.band).toBe("critical");
    expect(entry.thresholds).toEqual(DEFAULT_THRESHOLDS);
  });
});

describe("buildLatencyBandReport", () => {
  it("groups entries by band", () => {
    const entries = [
      buildLatencyBandEntry("https://a.com", [100]),
      buildLatencyBandEntry("https://b.com", [400]),
      buildLatencyBandEntry("https://c.com", [1000]),
      buildLatencyBandEntry("https://d.com", [3000]),
    ];
    const report = buildLatencyBandReport(entries);
    expect(report.fast).toHaveLength(1);
    expect(report.normal).toHaveLength(1);
    expect(report.slow).toHaveLength(1);
    expect(report.critical).toHaveLength(1);
  });

  it("returns empty arrays for unused bands", () => {
    const report = buildLatencyBandReport([]);
    expect(report.fast).toHaveLength(0);
    expect(report.critical).toHaveLength(0);
  });
});
