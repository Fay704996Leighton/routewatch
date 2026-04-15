import {
  buildAlertsFromRegressions,
  buildAlertsFromSchemaDrift,
  mergeAlerts,
  Alert,
} from "./alert";
import { RegressionResult } from "./regression";
import { SchemaDriftResult } from "./schema-checker";

function makeRegression(endpoint: string, percentChange: number): RegressionResult {
  return {
    endpoint,
    baselineAvg: 100,
    currentAvg: 100 + (100 * percentChange) / 100,
    percentChange,
    exceeded: true,
  };
}

function makeDrift(
  endpoint: string,
  addedKeys: string[],
  removedKeys: string[]
): SchemaDriftResult {
  return { endpoint, hasDrift: true, addedKeys, removedKeys };
}

describe("buildAlertsFromRegressions", () => {
  it("returns warn for moderate regression", () => {
    const alerts = buildAlertsFromRegressions([makeRegression("GET /api/users", 50)]);
    expect(alerts).toHaveLength(1);
    expect(alerts[0].severity).toBe("warn");
    expect(alerts[0].type).toBe("regression");
    expect(alerts[0].endpoint).toBe("GET /api/users");
  });

  it("returns critical for >= 100% regression", () => {
    const alerts = buildAlertsFromRegressions([makeRegression("GET /api/orders", 100)]);
    expect(alerts[0].severity).toBe("critical");
  });

  it("returns empty array for no regressions", () => {
    expect(buildAlertsFromRegressions([])).toEqual([]);
  });
});

describe("buildAlertsFromSchemaDrift", () => {
  it("creates alert for drifted endpoints", () => {
    const alerts = buildAlertsFromSchemaDrift([makeDrift("GET /api/items", ["newField"], [])]);
    expect(alerts).toHaveLength(1);
    expect(alerts[0].type).toBe("schema-drift");
    expect(alerts[0].message).toContain("newField");
  });

  it("filters out non-drifted results", () => {
    const result: SchemaDriftResult = { endpoint: "GET /x", hasDrift: false, addedKeys: [], removedKeys: [] };
    expect(buildAlertsFromSchemaDrift([result])).toHaveLength(0);
  });
});

describe("mergeAlerts", () => {
  it("sorts critical alerts before warn", () => {
    const warn: Alert = { endpoint: "a", severity: "warn", type: "regression", message: "", timestamp: "" };
    const critical: Alert = { endpoint: "b", severity: "critical", type: "regression", message: "", timestamp: "" };
    const merged = mergeAlerts([warn], [critical]);
    expect(merged[0].severity).toBe("critical");
  });

  it("merges both arrays", () => {
    const a: Alert = { endpoint: "a", severity: "warn", type: "regression", message: "", timestamp: "" };
    const b: Alert = { endpoint: "b", severity: "warn", type: "schema-drift", message: "", timestamp: "" };
    expect(mergeAlerts([a], [b])).toHaveLength(2);
  });
});
