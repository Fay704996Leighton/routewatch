import { describe, it, expect } from "vitest";
import {
  resolveEscalationLevel,
  buildEscalationReport,
  EscalationRule,
} from "./escalation";
import { Alert } from "./alert";

function makeAlert(url: string, type: Alert["type"] = "regression"): Alert {
  return {
    url,
    type,
    severity: "warning",
    message: "test alert",
    timestamp: new Date().toISOString(),
  };
}

const rules: EscalationRule[] = [
  { minOccurrences: 1, withinMs: Infinity, escalateTo: "low" },
  { minOccurrences: 3, withinMs: 300_000, escalateTo: "medium" },
  { minOccurrences: 5, withinMs: 300_000, escalateTo: "high" },
  { minOccurrences: 10, withinMs: 600_000, escalateTo: "critical" },
];

describe("resolveEscalationLevel", () => {
  it("returns low for single occurrence", () => {
    expect(resolveEscalationLevel(1, 0, rules)).toBe("low");
  });

  it("returns medium for 3 occurrences within window", () => {
    expect(resolveEscalationLevel(3, 60_000, rules)).toBe("medium");
  });

  it("returns high for 5 occurrences within window", () => {
    expect(resolveEscalationLevel(5, 60_000, rules)).toBe("high");
  });

  it("returns critical for 10 occurrences within window", () => {
    expect(resolveEscalationLevel(10, 60_000, rules)).toBe("critical");
  });

  it("does not escalate if outside window", () => {
    expect(resolveEscalationLevel(3, 999_999, rules)).toBe("low");
  });
});

describe("buildEscalationReport", () => {
  it("groups alerts by url+type", () => {
    const alerts = [
      makeAlert("https://api.example.com/a"),
      makeAlert("https://api.example.com/a"),
      makeAlert("https://api.example.com/b"),
    ];
    const report = buildEscalationReport(alerts, rules);
    expect(report.entries).toHaveLength(2);
  });

  it("sets occurrences correctly", () => {
    const alerts = Array.from({ length: 4 }, () => makeAlert("https://x.io/ep"));
    const report = buildEscalationReport(alerts, rules);
    expect(report.entries[0].occurrences).toBe(4);
  });

  it("includes generatedAt", () => {
    const report = buildEscalationReport([], rules);
    expect(report.generatedAt).toBeTruthy();
  });
});
