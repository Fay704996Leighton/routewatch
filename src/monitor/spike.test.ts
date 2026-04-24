import { describe, it, expect } from "vitest";
import {
  isSpike,
  buildSpikeEntry,
  buildSpikeReport,
  spikeToJson,
  formatSpikeReport,
  SpikeEntry,
} from "./spike";

const TS = "2024-06-01T12:00:00.000Z";

function makeEntry(url: string, duration: number, baselineAvg: number, threshold = 3.0): SpikeEntry {
  return buildSpikeEntry(url, duration, baselineAvg, threshold, TS);
}

describe("isSpike", () => {
  it("returns true when ratio meets threshold", () => {
    expect(isSpike(900, 300, 3.0)).toBe(true);
  });

  it("returns false when ratio is below threshold", () => {
    expect(isSpike(500, 300, 3.0)).toBe(false);
  });

  it("returns false when baselineAvg is zero", () => {
    expect(isSpike(1000, 0, 3.0)).toBe(false);
  });
});

describe("buildSpikeEntry", () => {
  it("marks entry as spike when duration exceeds threshold", () => {
    const entry = makeEntry("https://api.example.com/users", 1200, 300);
    expect(entry.isSpike).toBe(true);
    expect(entry.ratio).toBe(4);
    expect(entry.url).toBe("https://api.example.com/users");
    expect(entry.timestamp).toBe(TS);
  });

  it("marks entry as non-spike when duration is within threshold", () => {
    const entry = makeEntry("https://api.example.com/health", 400, 300);
    expect(entry.isSpike).toBe(false);
    expect(entry.ratio).toBeLessThan(3);
  });

  it("handles zero baselineAvg gracefully", () => {
    const entry = makeEntry("https://api.example.com/slow", 500, 0);
    expect(entry.isSpike).toBe(false);
    expect(entry.ratio).toBe(0);
  });
});

describe("buildSpikeReport", () => {
  it("counts spikes correctly", () => {
    const entries = [
      makeEntry("https://api.example.com/a", 1500, 300),
      makeEntry("https://api.example.com/b", 350, 300),
      makeEntry("https://api.example.com/c", 2000, 300),
    ];
    const report = buildSpikeReport(entries, 3.0);
    expect(report.spikeCount).toBe(2);
    expect(report.entries).toHaveLength(3);
    expect(report.spikeThresholdRatio).toBe(3.0);
  });

  it("defaults threshold to 3.0", () => {
    const report = buildSpikeReport([]);
    expect(report.spikeThresholdRatio).toBe(3.0);
  });
});

describe("spikeToJson", () => {
  it("produces valid JSON", () => {
    const report = buildSpikeReport([makeEntry("https://api.example.com/x", 900, 300)]);
    const json = spikeToJson(report);
    const parsed = JSON.parse(json);
    expect(parsed.spikeCount).toBe(1);
  });
});

describe("formatSpikeReport", () => {
  it("includes spike label for spiking entries", () => {
    const entries = [makeEntry("https://api.example.com/z", 1800, 300)];
    const report = buildSpikeReport(entries);
    const text = formatSpikeReport(report);
    expect(text).toContain("[SPIKE]");
    expect(text).toContain("https://api.example.com/z");
  });

  it("shows ok label for normal entries", () => {
    const entries = [makeEntry("https://api.example.com/ok", 200, 300)];
    const report = buildSpikeReport(entries);
    const text = formatSpikeReport(report);
    expect(text).toContain("[ok]");
  });
});
