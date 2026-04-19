import { buildReplayReport, formatReplayReport, replayToJson } from "./replay";
import { HistoryEntry } from "./history";

function makeEntry(url: string, timestamp: string, ok = true): HistoryEntry {
  return {
    url,
    timestamp,
    duration: 120,
    status: ok ? 200 : 500,
    ok,
    label: "test",
  };
}

const entries: HistoryEntry[] = [
  makeEntry("https://api.example.com/a", "2024-01-01T10:00:00Z"),
  makeEntry("https://api.example.com/b", "2024-01-02T10:00:00Z", false),
  makeEntry("https://api.example.com/c", "2024-01-03T10:00:00Z"),
];

describe("buildReplayReport", () => {
  it("includes entries within range", () => {
    const report = buildReplayReport(entries, "2024-01-01T00:00:00Z", "2024-01-02T23:59:59Z");
    expect(report.replayed).toBe(2);
    expect(report.skipped).toBe(1);
    expect(report.total).toBe(3);
  });

  it("excludes entries before from", () => {
    const report = buildReplayReport(entries, "2024-01-03T00:00:00Z", "2024-01-04T00:00:00Z");
    expect(report.replayed).toBe(1);
    expect(report.entries[0].url).toBe("https://api.example.com/c");
  });

  it("returns empty when range matches nothing", () => {
    const report = buildReplayReport(entries, "2025-01-01T00:00:00Z", "2025-01-02T00:00:00Z");
    expect(report.replayed).toBe(0);
    expect(report.skipped).toBe(3);
  });
});

describe("formatReplayReport", () => {
  it("contains header and entry lines", () => {
    const report = buildReplayReport(entries, "2024-01-01T00:00:00Z", "2024-01-04T00:00:00Z");
    const text = formatReplayReport(report);
    expect(text).toContain("Replay Report");
    expect(text).toContain("https://api.example.com/a");
    expect(text).toContain("FAIL");
  });
});

describe("replayToJson", () => {
  it("produces valid JSON", () => {
    const report = buildReplayReport(entries, "2024-01-01T00:00:00Z");
    const json = JSON.parse(replayToJson(report));
    expect(json).toHaveProperty("entries");
    expect(json).toHaveProperty("total");
  });
});
