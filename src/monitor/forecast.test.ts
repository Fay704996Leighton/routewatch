import { describe, it, expect } from "vitest";
import {
  buildForecastEntry,
  buildForecastReport,
  formatForecastReport,
  forecastToJson,
} from "./forecast";
import { TrendEntry, TrendReport } from "./trend";

function makeTrendEntry(url: string, avgDuration: number, slope: number): TrendEntry {
  return { url, avgDuration, slope, classification: slope > 0 ? "degrading" : "stable", sampleCount: 10 };
}

function makeTrendReport(entries: TrendEntry[]): TrendReport {
  return { generatedAt: new Date().toISOString(), entries };
}

describe("buildForecastEntry", () => {
  it("projects future latency using slope", () => {
    const entry = makeTrendEntry("https://api.example.com", 200, 10);
    const result = buildForecastEntry(entry, 5, 300);
    expect(result.forecastMs).toBeCloseTo(250);
    expect(result.willExceedThreshold).toBe(false);
  });

  it("flags entries that will exceed threshold", () => {
    const entry = makeTrendEntry("https://api.example.com", 280, 10);
    const result = buildForecastEntry(entry, 5, 300);
    expect(result.forecastMs).toBeCloseTo(330);
    expect(result.willExceedThreshold).toBe(true);
  });

  it("clamps forecast to 0 for negative projections", () => {
    const entry = makeTrendEntry("https://api.example.com", 50, -100);
    const result = buildForecastEntry(entry, 5, 300);
    expect(result.forecastMs).toBe(0);
  });
});

describe("buildForecastReport", () => {
  it("builds report for all trend entries", () => {
    const trend = makeTrendReport([
      makeTrendEntry("https://a.com", 100, 5),
      makeTrendEntry("https://b.com", 200, -2),
    ]);
    const report = buildForecastReport(trend, 10, 500);
    expect(report.entries).toHaveLength(2);
    expect(report.horizon).toBe(10);
    expect(report.generatedAt).toBeTruthy();
  });
});

describe("formatForecastReport", () => {
  it("includes EXCEED marker for threshold violations", () => {
    const trend = makeTrendReport([makeTrendEntry("https://slow.com", 490, 5)]);
    const report = buildForecastReport(trend, 5, 500);
    const text = formatForecastReport(report);
    expect(text).toContain("[EXCEED]");
    expect(text).toContain("https://slow.com");
  });

  it("serializes to json", () => {
    const trend = makeTrendReport([makeTrendEntry("https://a.com", 100, 1)]);
    const report = buildForecastReport(trend, 3, 300);
    const json = JSON.parse(forecastToJson(report));
    expect(json.entries[0].url).toBe("https://a.com");
  });
});
