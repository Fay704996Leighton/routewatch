import { buildSignalReport, formatSignalReport, signalToJson } from "./signal";
import { Alert } from "./alert";

function makeAlert(url: string, severity: "info" | "warning" | "critical"): Alert {
  return {
    id: `${url}-${severity}`,
    url,
    severity,
    message: `${severity} alert for ${url}`,
    timestamp: new Date().toISOString(),
    type: "regression",
  };
}

describe("buildSignalReport", () => {
  it("returns none level for empty alerts", () => {
    const report = buildSignalReport([]);
    expect(report.entries).toHaveLength(0);
    expect(report.overallLevel).toBe("none");
  });

  it("groups alerts by url", () => {
    const alerts = [
      makeAlert("https://api.example.com/a", "info"),
      makeAlert("https://api.example.com/a", "warning"),
      makeAlert("https://api.example.com/b", "critical"),
    ];
    const report = buildSignalReport(alerts);
    expect(report.entries).toHaveLength(2);
    const a = report.entries.find(e => e.url === "https://api.example.com/a");
    expect(a?.alertCount).toBe(2);
    expect(a?.maxSeverity).toBe("warning");
  });

  it("sorts entries by score descending", () => {
    const alerts = [
      makeAlert("https://api.example.com/low", "info"),
      makeAlert("https://api.example.com/high", "critical"),
      makeAlert("https://api.example.com/high", "critical"),
    ];
    const report = buildSignalReport(alerts);
    expect(report.entries[0].url).toBe("https://api.example.com/high");
  });

  it("assigns correct level for critical score", () => {
    const alerts = Array.from({ length: 4 }, () => makeAlert("https://api.example.com/x", "critical"));
    const report = buildSignalReport(alerts);
    expect(report.entries[0].level).toBe("critical");
    expect(report.overallLevel).toBe("critical");
  });

  it("includes generatedAt timestamp", () => {
    const report = buildSignalReport([]);
    expect(report.generatedAt).toMatch(/^\d{4}-\d{2}-\d{2}/);
  });
});

describe("formatSignalReport", () => {
  it("includes overall level", () => {
    const report = buildSignalReport([makeAlert("https://api.example.com/z", "warning")]);
    const text = formatSignalReport(report);
    expect(text).toContain("Overall Level:");
    expect(text).toContain("https://api.example.com/z");
  });

  it("shows no signals message when empty", () => {
    const text = formatSignalReport(buildSignalReport([]));
    expect(text).toContain("No signals detected.");
  });
});

describe("signalToJson", () => {
  it("returns valid JSON", () => {
    const report = buildSignalReport([makeAlert("https://api.example.com/j", "info")]);
    const json = signalToJson(report);
    expect(() => JSON.parse(json)).not.toThrow();
  });
});
