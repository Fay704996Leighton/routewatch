import { describe, it, expect } from "vitest";
import {
  formatEscalationEntry,
  formatEscalationReport,
  escalationToJson,
} from "./escalation-formatter";
import { EscalationEntry, EscalationReport } from "../monitor/escalation";

function makeEntry(overrides: Partial<EscalationEntry> = {}): EscalationEntry {
  return {
    alertKey: "https://api.example.com/users::regression",
    level: "medium",
    occurrences: 3,
    firstSeen: Date.now() - 60_000,
    lastSeen: Date.now(),
    ...overrides,
  };
}

describe("formatEscalationEntry", () => {
  it("includes alertKey", () => {
    const out = formatEscalationEntry(makeEntry());
    expect(out).toContain("https://api.example.com/users::regression");
  });

  it("includes level label", () => {
    const out = formatEscalationEntry(makeEntry({ level: "critical" }));
    expect(out).toContain("CRITICAL");
  });

  it("includes occurrences", () => {
    const out = formatEscalationEntry(makeEntry({ occurrences: 7 }));
    expect(out).toContain("7");
  });
});

describe("formatEscalationReport", () => {
  it("shows no escalations when empty", () => {
    const report: EscalationReport = { generatedAt: new Date().toISOString(), entries: [] };
    expect(formatEscalationReport(report)).toContain("No escalations");
  });

  it("includes entries when present", () => {
    const report: EscalationReport = {
      generatedAt: new Date().toISOString(),
      entries: [makeEntry()],
    };
    const out = formatEscalationReport(report);
    expect(out).toContain("MEDIUM");
    expect(out).toContain("Escalation Report");
  });
});

describe("escalationToJson", () => {
  it("returns valid JSON", () => {
    const report: EscalationReport = { generatedAt: new Date().toISOString(), entries: [makeEntry()] };
    const json = escalationToJson(report);
    expect(() => JSON.parse(json)).not.toThrow();
  });
});
