import { evaluateBudget, buildBudgetReport, BudgetRule } from "./budget";

const rule: BudgetRule = {
  route: "GET /api/users",
  maxP50Ms: 200,
  maxP95Ms: 500,
  maxErrorRate: 0.05,
};

describe("evaluateBudget", () => {
  it("returns ok when all within budget", () => {
    const durations = [100, 120, 130, 150, 180];
    const result = evaluateBudget(rule, durations, 0, 10);
    expect(result.ok).toBe(true);
    expect(result.p50Breach).toBe(false);
    expect(result.p95Breach).toBe(false);
    expect(result.errorRateBreach).toBe(false);
  });

  it("detects p50 breach", () => {
    const durations = [250, 260, 270, 280, 290];
    const result = evaluateBudget(rule, durations, 0, 10);
    expect(result.p50Breach).toBe(true);
    expect(result.ok).toBe(false);
  });

  it("detects p95 breach", () => {
    const durations = [100, 110, 120, 130, 600];
    const result = evaluateBudget(rule, durations, 0, 10);
    expect(result.p95Breach).toBe(true);
    expect(result.ok).toBe(false);
  });

  it("detects error rate breach", () => {
    const durations = [100, 110];
    const result = evaluateBudget(rule, durations, 2, 10);
    expect(result.errorRateBreach).toBe(true);
    expect(result.errorRate).toBeCloseTo(0.2);
    expect(result.ok).toBe(false);
  });

  it("handles empty durations", () => {
    const result = evaluateBudget(rule, [], 0, 0);
    expect(result.p50Ms).toBe(0);
    expect(result.p95Ms).toBe(0);
    expect(result.errorRate).toBe(0);
  });
});

describe("buildBudgetReport", () => {
  it("aggregates results and sets allOk", () => {
    const rules: BudgetRule[] = [
      { route: "GET /a", maxP50Ms: 200, maxP95Ms: 500, maxErrorRate: 0.05 },
      { route: "GET /b", maxP50Ms: 200, maxP95Ms: 500, maxErrorRate: 0.05 },
    ];
    const getData = (route: string) =>
      route === "GET /a"
        ? { durations: [100, 150], errorCount: 0, totalCount: 5 }
        : { durations: [300, 350], errorCount: 0, totalCount: 5 };

    const report = buildBudgetReport(rules, getData);
    expect(report.results).toHaveLength(2);
    expect(report.allOk).toBe(false);
    expect(report.results[0].ok).toBe(true);
    expect(report.results[1].ok).toBe(false);
    expect(report.evaluatedAt).toBeTruthy();
  });
});
