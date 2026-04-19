import {
  formatReplayEntry,
  formatReplayReportText,
  replaySummaryLine,
  replayReportToJson,
} from "./replay-formatter";
import { ReplayReport, ReplayEntry } from "../monitor/replay";

function makeEntry(ok = true): ReplayEntry {
  return {
    url: "https://api.example.com/users",
    timestamp: "2024-06-01T12:00:00Z",
    duration: 200,
    status: ok ? 200 : 503,
    ok,
    label: "prod",
  };
}

function makeReport(replayed: number, total: number): ReplayReport {
  const entries: ReplayEntry[] = Array.from({ length: replayed }, () => makeEntry());
  return { entries, total, replayed, skipped: total - replayed };
}

describe("formatReplayEntry", () => {
  it("marks successful entry with checkmark", () => {
    expect(formatReplayEntry(makeEntry(true))).toContain("✔");
  });

  it("marks failed entry with cross", () => {
    expect(formatReplayEntry(makeEntry(false))).toContain("✘");
  });

  it("includes url and status", () => {
    const line = formatReplayEntry(makeEntry());
    expect(line).toContain("https://api.example.com/users");
    expect(line).toContain("HTTP 200");
  });

  it("handles null status", () => {
    const e = makeEntry();
    e.status = null;
    expect(formatReplayEntry(e)).toContain("no-response");
  });
});

describe("formatReplayReportText", () => {
  it("shows summary header", () => {
    const r = makeReport(2, 5);
    const text = formatReplayReportText(r);
    expect(text).toContain("Replayed: 2");
    expect(text).toContain("Skipped: 3");
  });

  it("shows no entries message when empty", () => {
    const r = makeReport(0, 3);
    expect(formatReplayReportText(r)).toContain("No entries in range");
  });
});

describe("replaySummaryLine", () => {
  it("calculates percentage", () => {
    const line = replaySummaryLine(makeReport(3, 4));
    expect(line).toContain("75.0%");
  });

  it("handles zero total", () => {
    expect(replaySummaryLine(makeReport(0, 0))).toContain("0.0%");
  });
});

describe("replayReportToJson", () => {
  it("serializes report", () => {
    const r = makeReport(1, 2);
    const obj = JSON.parse(replayReportToJson(r));
    expect(obj.replayed).toBe(1);
  });
});
