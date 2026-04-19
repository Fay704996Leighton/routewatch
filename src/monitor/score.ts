import { HealthReport } from "./health";
import { UptimeReport } from "./uptime";
import { BudgetReport } from "./budget";
import { AnomalyReport } from "./anomaly";

export interface ScoreWeights {
  health: number;
  uptime: number;
  budget: number;
  anomaly: number;
}

export interface ScoreEntry {
  url: string;
  score: number; // 0–100
  grade: "A" | "B" | "C" | "D" | "F";
  breakdown: Record<string, number>;
}

export interface ScoreReport {
  generatedAt: string;
  entries: ScoreEntry[];
  overall: number;
}

const DEFAULT_WEIGHTS: ScoreWeights = {
  health: 0.4,
  uptime: 0.3,
  budget: 0.2,
  anomaly: 0.1,
};

export function gradeFromScore(score: number): ScoreEntry["grade"] {
  if (score >= 90) return "A";
  if (score >= 75) return "B";
  if (score >= 60) return "C";
  if (score >= 45) return "D";
  return "F";
}

export function buildScoreReport(
  health: HealthReport,
  uptime: UptimeReport,
  budget: BudgetReport,
  anomalies: AnomalyReport,
  weights: ScoreWeights = DEFAULT_WEIGHTS
): ScoreReport {
  const urls = Array.from(
    new Set([
      ...health.entries.map((e) => e.url),
      ...uptime.entries.map((e) => e.url),
    ])
  );

  const entries: ScoreEntry[] = urls.map((url) => {
    const h = health.entries.find((e) => e.url === url);
    const u = uptime.entries.find((e) => e.url === url);
    const b = budget.entries.find((e) => e.url === url);
    const aCount = anomalies.anomalies.filter((a) => a.url === url).length;

    const healthScore = h ? (h.status === "healthy" ? 100 : h.status === "degraded" ? 50 : 0) : 0;
    const uptimeScore = u ? Math.min(100, u.uptimePercent) : 0;
    const budgetScore = b ? (b.withinBudget ? 100 : Math.max(0, 100 - b.p95 / 10)) : 100;
    const anomalyScore = Math.max(0, 100 - aCount * 20);

    const score =
      healthScore * weights.health +
      uptimeScore * weights.uptime +
      budgetScore * weights.budget +
      anomalyScore * weights.anomaly;

    return {
      url,
      score: Math.round(score),
      grade: gradeFromScore(score),
      breakdown: {
        health: Math.round(healthScore),
        uptime: Math.round(uptimeScore),
        budget: Math.round(budgetScore),
        anomaly: Math.round(anomalyScore),
      },
    };
  });

  const overall =
    entries.length > 0
      ? Math.round(entries.reduce((s, e) => s + e.score, 0) / entries.length)
      : 0;

  return { generatedAt: new Date().toISOString(), entries, overall };
}

export function scoreToJson(report: ScoreReport): string {
  return JSON.stringify(report, null, 2);
}

export function formatScoreReport(report: ScoreReport): string {
  const lines: string[] = [
    `Score Report — ${report.generatedAt}`,
    `Overall Score: ${report.overall}/100`,
    "",
  ];
  for (const e of report.entries) {
    lines.push(`  [${e.grade}] ${e.url} — ${e.score}/100`);
    lines.push(
      `       health:${e.breakdown.health} uptime:${e.breakdown.uptime} budget:${e.breakdown.budget} anomaly:${e.breakdown.anomaly}`
    );
  }
  return lines.join("\n");
}
