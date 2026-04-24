import { describe, it, expect, beforeEach } from "vitest";
import {
  classifyPressure,
  buildPressureEntry,
  buildPressureReport,
  pressureToJson,
  formatPressureReport,
  PressureEntry,
} from "./pressure";

function makeEntry(overrides: Partial<PressureEntry> = {}): PressureEntry {
  return {
    url: "https://api.example.com/health",
    inFlight: 2,
    peak: 5,
    level: "low",
    timestamp: "2024-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("classifyPressure", () => {
  it("returns low when ratio < 0.4", () => {
    expect(classifyPressure(3, 10)).toBe("low");
  });

  it("returns medium when ratio in [0.4, 0.75)", () => {
    expect(classifyPressure(5, 10)).toBe("medium");
  });

  it("returns high when ratio in [0.75, 1.0)", () => {
    expect(classifyPressure(8, 10)).toBe("high");
  });

  it("returns critical when ratio >= 1.0", () => {
    expect(classifyPressure(10, 10)).toBe("critical");
    expect(classifyPressure(12, 10)).toBe("critical");
  });

  it("returns low when maxConcurrent is 0", () => {
    expect(classifyPressure(0, 0)).toBe("low");
  });
});

describe("buildPressureEntry", () => {
  it("builds an entry with correct level", () => {
    const entry = buildPressureEntry("https://api.example.com/v1", 9, 12, 10);
    expect(entry.url).toBe("https://api.example.com/v1");
    expect(entry.inFlight).toBe(9);
    expect(entry.peak).toBe(12);
    expect(entry.level).toBe("high");
    expect(entry.timestamp).toBeTruthy();
  });
});

describe("buildPressureReport", () => {
  it("wraps entries in a report", () => {
    const entries = [makeEntry(), makeEntry({ url: "https://api.example.com/v2", level: "high" })];
    const report = buildPressureReport(entries);
    expect(report.entries).toHaveLength(2);
    expect(report.generatedAt).toBeTruthy();
  });
});

describe("pressureToJson", () => {
  it("serialises to valid JSON", () => {
    const report = buildPressureReport([makeEntry()]);
    const json = pressureToJson(report);
    const parsed = JSON.parse(json);
    expect(parsed.entries).toHaveLength(1);
  });
});

describe("formatPressureReport", () => {
  it("includes level and url in output", () => {
    const report = buildPressureReport([makeEntry({ level: "critical", inFlight: 10, peak: 10 })]);
    const text = formatPressureReport(report);
    expect(text).toContain("CRITICAL");
    expect(text).toContain("https://api.example.com/health");
    expect(text).toContain("in-flight=10");
  });

  it("shows (no data) for empty report", () => {
    const text = formatPressureReport(buildPressureReport([]));
    expect(text).toContain("(no data)");
  });
});
