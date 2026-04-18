import {
  buildIncident,
  buildIncidentReport,
  resolveIncident,
  incidentToJson,
} from "./incident";
import { Alert } from "./alert";
import {
  formatIncidentEntry,
  formatIncidentReport,
} from "../reporter/incident-formatter";

function makeAlert(severity: Alert["severity"] = "high"): Alert {
  return {
    url: "https://api.example.com/users",
    severity,
    type: "regression",
    message: "Response time regression detected",
    timestamp: Date.now(),
  };
}

describe("buildIncident", () => {
  it("builds an incident from alerts", () => {
    const alerts = [makeAlert("high"), makeAlert("medium")];
    const incident = buildIncident(alerts, 1000);
    expect(incident.url).toBe("https://api.example.com/users");
    expect(incident.severity).toBe("high");
    expect(incident.alertCount).toBe(2);
    expect(incident.resolvedAt).toBeUndefined();
  });

  it("picks critical as highest severity", () => {
    const alerts = [makeAlert("medium"), makeAlert("critical")];
    const incident = buildIncident(alerts, 1000);
    expect(incident.severity).toBe("critical");
  });

  it("throws on empty alerts", () => {
    expect(() => buildIncident([])).toThrow();
  });
});

describe("resolveIncident", () => {
  it("sets resolvedAt", () => {
    const incident = buildIncident([makeAlert()], 1000);
    const resolved = resolveIncident(incident, 2000);
    expect(resolved.resolvedAt).toBe(2000);
    expect(resolved.openedAt).toBe(1000);
  });
});

describe("buildIncidentReport", () => {
  it("counts open and resolved", () => {
    const a = buildIncident([makeAlert()], 1000);
    const b = resolveIncident(buildIncident([makeAlert()], 2000), 3000);
    const report = buildIncidentReport([a, b]);
    expect(report.total).toBe(2);
    expect(report.open).toBe(1);
    expect(report.resolved).toBe(1);
  });
});

describe("formatIncidentReport", () => {
  it("includes OPEN and url", () => {
    const incident = buildIncident([makeAlert()], 1000);
    const report = buildIncidentReport([incident]);
    const text = formatIncidentReport(report);
    expect(text).toContain("OPEN");
    expect(text).toContain("api.example.com");
  });

  it("incidentToJson returns valid JSON", () => {
    const report = buildIncidentReport([buildIncident([makeAlert()], 1000)]);
    const json = incidentToJson(report);
    expect(() => JSON.parse(json)).not.toThrow();
  });
});
