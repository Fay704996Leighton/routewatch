/**
 * Correlates response time trends with error rates to surface
 * endpoints under compounding stress.
 */

import { TrendReport } from "./trend";
import { HealthReport } from "./health";

export interface CorrelationEntry {
  url: string;
  slopeMs: number;
  errorRate: number; // 0–1
  score: number;     // composite risk score 0–100
  risk: "low" | "medium" | "high";
}

export interface CorrelationReport {
  generatedAt: string;
  entries: CorrelationEntry[];
}

function riskLevel(score: number): "low" | "medium" | "high" {
  if (score >= 66) return "high";
  if (score >= 33) return "medium";
  return "low";
}

export function buildCorrelationReport(
  trend: TrendReport,
  health: HealthReport
): CorrelationReport {
  const healthByUrl = new Map(
    health.entries.map((e) => [e.url, e])
  );

  const entries: CorrelationEntry[] = trend.entries.map((t) => {
    const h = healthByUrl.get(t.url);
    const total = h ? h.total : 0;
    const errors = h ? h.errors : 0;
    const errorRate = total > 0 ? errors / total : 0;

    // Normalise slope: assume >2000 ms/sample is worst case
    const normSlope = Math.min(Math.max(t.slopeMs, 0), 2000) / 2000;
    const score = Math.round((normSlope * 0.6 + errorRate * 0.4) * 100);

    return {
      url: t.url,
      slopeMs: t.slopeMs,
      errorRate,
      score,
      risk: riskLevel(score),
    };
  });

  entries.sort((a, b) => b.score - a.score);

  return { generatedAt: new Date().toISOString(), entries };
}

export function correlationToJson(report: CorrelationReport): string {
  return JSON.stringify(report, null, 2);
}

export function formatCorrelationReport(report: CorrelationReport): string {
  const lines: string[] = [
    `Correlation Report — ${report.generatedAt}`,
    "-".repeat(52),
  ];
  for (const e of report.entries) {
    lines.push(
      `[${e.risk.toUpperCase().padEnd(6)}] ${e.url}  score=${e.score}  slope=${e.slopeMs.toFixed(1)}ms/sample  errorRate=${(e.errorRate * 100).toFixed(1)}%`
    );
  }
  return lines.join("\n");
}
