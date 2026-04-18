import { describe, it, expect } from "vitest";
import {
  buildChangelogEntry,
  buildChangelogReport,
  formatChangelogReport,
  changelogToJson,
} from "./changelog";
import { Alert } from "./alert";

function makeAlert(overrides: Partial<Alert> = {}): Alert {
  return {
    url: "https://api.example.com/health",
    severity: "warning",
    message: "Response time regression detected",
    tag: "perf",
    ...overrides,
  };
}

describe("buildChangelogEntry", () => {
  it("maps alert fields correctly", () => {
    const entry = buildChangelogEntry(makeAlert());
    expect(entry.url).toBe("https://api.example.com/health");
    expect(entry.severity).toBe("warning");
    expect(entry.message).toBe("Response time regression detected");
    expect(entry.tag).toBe("perf");
    expect(entry.timestamp).toBeTruthy();
  });

  it("maps critical severity", () => {
    const entry = buildChangelogEntry(makeAlert({ severity: "critical" }));
    expect(entry.severity).toBe("critical");
  });

  it("maps info severity", () => {
    const entry = buildChangelogEntry(makeAlert({ severity: "info" }));
    expect(entry.severity).toBe("info");
  });
});

describe("buildChangelogReport", () => {
  it("builds a report with entries", () => {
    const report = buildChangelogReport([makeAlert(), makeAlert({ severity: "critical" })]);
    expect(report.entries).toHaveLength(2);
    expect(report.generatedAt).toBeTruthy();
  });

  it("returns empty entries for no alerts", () => {
    const report = buildChangelogReport([]);
    expect(report.entries).toHaveLength(0);
  });
});

describe("formatChangelogReport", () => {
  it("returns no entries message when empty", () => {
    const report = buildChangelogReport([]);
    expect(formatChangelogReport(report)).toContain("no entries");
  });

  it("formats entries with severity and tag", () => {
    const report = buildChangelogReport([makeAlert()]);
    const text = formatChangelogReport(report);
    expect(text).toContain("WARNING");
    expect(text).toContain("[perf]");
    expect(text).toContain("api.example.com");
  });
});

describe("changelogToJson", () => {
  it("produces valid JSON", () => {
    const report = buildChangelogReport([makeAlert()]);
    const json = changelogToJson(report);
    const parsed = JSON.parse(json);
    expect(parsed.entries).toHaveLength(1);
  });
});
