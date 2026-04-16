import { buildStatusPage, formatStatusPage, statusPageToJson } from "./status-page";
import { HealthReport } from "./health";
import { Alert } from "./alert";
import { RegressionResult } from "./regression";

function makeHealthReport(healthy: number, unhealthy: number): HealthReport {
  const entries = [
    ...Array(healthy).fill({ route: "r", status: "healthy", avgMs: 100, samples: 1 }),
    ...Array(unhealthy).fill({ route: "r2", status: "unhealthy", avgMs: 500, samples: 1 }),
  ];
  return { entries, summary: { healthy, unhealthy, total: healthy + unhealthy } } as HealthReport;
}

function makeAlert(severity: "warning" | "critical", message = "alert"): Alert {
  return { id: "a1", severity, message, route: "/test", triggeredAt: new Date().toISOString() } as Alert;
}

describe("buildStatusPage", () => {
  it("returns ok when no alerts and all healthy", () => {
    const page = buildStatusPage(makeHealthReport(3, 0), [], []);
    expect(page.overallStatus).toBe("ok");
  });

  it("returns degraded on warning alert", () => {
    const page = buildStatusPage(makeHealthReport(3, 0), [makeAlert("warning")], []);
    expect(page.overallStatus).toBe("degraded");
  });

  it("returns down on critical alert", () => {
    const page = buildStatusPage(makeHealthReport(3, 0), [makeAlert("critical")], []);
    expect(page.overallStatus).toBe("down");
  });

  it("returns degraded when unhealthy entries exist", () => {
    const page = buildStatusPage(makeHealthReport(2, 1), [], []);
    expect(page.overallStatus).toBe("degraded");
  });

  it("includes generatedAt timestamp", () => {
    const page = buildStatusPage(makeHealthReport(1, 0), [], []);
    expect(page.generatedAt).toBeTruthy();
  });
});

describe("formatStatusPage", () => {
  it("includes overall status line", () => {
    const page = buildStatusPage(makeHealthReport(2, 0), [], []);
    const out = formatStatusPage(page);
    expect(out).toContain("Overall: OK");
  });

  it("lists alerts when present", () => {
    const page = buildStatusPage(makeHealthReport(1, 0), [makeAlert("warning", "slow endpoint")], []);
    const out = formatStatusPage(page);
    expect(out).toContain("slow endpoint");
  });
});

describe("statusPageToJson", () => {
  it("returns valid JSON", () => {
    const page = buildStatusPage(makeHealthReport(1, 0), [], []);
    const json = statusPageToJson(page);
    expect(() => JSON.parse(json)).not.toThrow();
  });
});
