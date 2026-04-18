export interface BudgetRule {
  route: string;
  maxP50Ms: number;
  maxP95Ms: number;
  maxErrorRate: number; // 0–1
}

export interface BudgetResult {
  route: string;
  p50Ms: number;
  p95Ms: number;
  errorRate: number;
  p50Breach: boolean;
  p95Breach: boolean;
  errorRateBreach: boolean;
  ok: boolean;
}

export interface BudgetReport {
  evaluatedAt: string;
  results: BudgetResult[];
  allOk: boolean;
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, idx)];
}

export function evaluateBudget(
  rule: BudgetRule,
  durations: number[],
  errorCount: number,
  totalCount: number
): BudgetResult {
  const sorted = [...durations].sort((a, b) => a - b);
  const p50Ms = percentile(sorted, 50);
  const p95Ms = percentile(sorted, 95);
  const errorRate = totalCount > 0 ? errorCount / totalCount : 0;

  const p50Breach = p50Ms > rule.maxP50Ms;
  const p95Breach = p95Ms > rule.maxP95Ms;
  const errorRateBreach = errorRate > rule.maxErrorRate;

  return {
    route: rule.route,
    p50Ms,
    p95Ms,
    errorRate,
    p50Breach,
    p95Breach,
    errorRateBreach,
    ok: !p50Breach && !p95Breach && !errorRateBreach,
  };
}

export function buildBudgetReport(
  rules: BudgetRule[],
  getData: (route: string) => { durations: number[]; errorCount: number; totalCount: number }
): BudgetReport {
  const results = rules.map((rule) => {
    const { durations, errorCount, totalCount } = getData(rule.route);
    return evaluateBudget(rule, durations, errorCount, totalCount);
  });

  return {
    evaluatedAt: new Date().toISOString(),
    results,
    allOk: results.every((r) => r.ok),
  };
}
