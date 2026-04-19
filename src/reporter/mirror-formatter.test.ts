import { formatMirrorEntry, formatMirrorReportText, mirrorSummaryLine, mirrorReportToJson } from "./mirror-formatter";
import type { MirrorEntry, MirrorReport } from "../monitor/mirror";

function makeEntry(overrides: Partial<MirrorEntry> = {}): MirrorEntry {
  return {
    url: "https://api.example.com/items",
    mirrorUrl: "https://mirror.example.com/items",
    statusMatch: true,
    primaryStatus: 200,
    mirrorStatus: 200,
    durationDeltaMs: 45,
    bodyMatch: true,
    timestamp: "2024-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function makeReport(entries: MirrorEntry[]): MirrorReport {
  const diverged = entries.filter((e) => !e.statusMatch || !e.bodyMatch).length;
  return { entries, totalCompared: entries.length, diverged };
}

describe("formatMirrorEntry", () => {
  it("includes url and delta", () => {
    const line = formatMirrorEntry(makeEntry());
    expect(line).toContain("api.example.com/items");
    expect(line).toContain("Δ45ms");
  });

  it("shows mismatch in status label", () => {
    const line = formatMirrorEntry(makeEntry({ statusMatch: false, mirrorStatus: 500 }));
    expect(line).toContain("mismatch");
  });

  it("shows body-drift when body does not match", () => {
    const line = formatMirrorEntry(makeEntry({ bodyMatch: false }));
    expect(line).toContain("body-drift");
  });
});

describe("formatMirrorReportText", () => {
  it("returns empty message when no entries", () => {
    expect(formatMirrorReportText(makeReport([]))).toContain("No mirror");
  });

  it("includes summary counts", () => {
    const text = formatMirrorReportText(makeReport([makeEntry(), makeEntry({ bodyMatch: false })]));
    expect(text).toContain("Total: 2");
    expect(text).toContain("Diverged: 1");
  });
});

describe("mirrorSummaryLine", () => {
  it("formats percentage correctly", () => {
    const line = mirrorSummaryLine(makeReport([makeEntry(), makeEntry({ statusMatch: false })]));
    expect(line).toContain("50.0%");
  });

  it("handles zero total", () => {
    const line = mirrorSummaryLine(makeReport([]));
    expect(line).toContain("0.0%");
  });
});

describe("mirrorReportToJson", () => {
  it("serializes to valid JSON", () => {
    const json = mirrorReportToJson(makeReport([makeEntry()]));
    const parsed = JSON.parse(json);
    expect(parsed.totalCompared).toBe(1);
  });
});
