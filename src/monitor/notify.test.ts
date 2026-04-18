import { describe, it, expect } from "vitest";
import { buildNotifyResults, formatNotifyResults, NotifyRule } from "./notify";
import { Alert } from "./alert";

function makeAlert(severity: "low" | "medium" | "high", url = "http://a.com"): Alert {
  return {
    id: `${url}-${severity}`,
    url,
    severity,
    type: "regression",
    message: `${severity} alert`,
    timestamp: Date.now(),
  };
}

describe("buildNotifyResults", () => {
  it("sends all alerts matching minSeverity", () => {
    const alerts = [makeAlert("low"), makeAlert("medium"), makeAlert("high")];
    const rules: NotifyRule[] = [{ channel: "console", minSeverity: "medium" }];
    const results = buildNotifyResults(alerts, rules);
    expect(results[0].sent).toBe(2);
    expect(results[0].skipped).toBe(1);
  });

  it("returns error when webhook has no target", () => {
    const alerts = [makeAlert("high")];
    const rules: NotifyRule[] = [{ channel: "webhook", minSeverity: "low" }];
    const results = buildNotifyResults(alerts, rules);
    expect(results[0].errors.length).toBeGreaterThan(0);
    expect(results[0].sent).toBe(0);
  });

  it("returns error when file channel has no target", () => {
    const alerts = [makeAlert("low")];
    const rules: NotifyRule[] = [{ channel: "file", minSeverity: "low" }];
    const results = buildNotifyResults(alerts, rules);
    expect(results[0].errors[0]).toMatch(/target path/);
  });

  it("handles empty alerts", () => {
    const rules: NotifyRule[] = [{ channel: "console", minSeverity: "low" }];
    const results = buildNotifyResults([], rules);
    expect(results[0].sent).toBe(0);
    expect(results[0].skipped).toBe(0);
  });

  it("handles empty rules", () => {
    const alerts = [makeAlert("high")];
    const results = buildNotifyResults(alerts, []);
    expect(results).toHaveLength(0);
  });
});

describe("formatNotifyResults", () => {
  it("formats results as text", () => {
    const results = [{ channel: "console" as const, sent: 3, skipped: 1, errors: [] }];
    const text = formatNotifyResults(results);
    expect(text).toContain("console");
    expect(text).toContain("sent=3");
  });

  it("returns default message for empty results", () => {
    expect(formatNotifyResults([])).toMatch(/No notification/);
  });

  it("includes errors in output", () => {
    const results = [{ channel: "webhook" as const, sent: 0, skipped: 2, errors: ["missing URL"] }];
    expect(formatNotifyResults(results)).toContain("missing URL");
  });
});
