import { HealthSummary } from "../monitor/health";

const STATUS_ICON: Record<string, string> = {
  healthy: "✅",
  degraded: "⚠️",
  down: "❌",
};

export function formatHealthEntry(summary: HealthSummary): string {
  const icon = STATUS_ICON[summary.status] ?? "?";
  const rate = (summary.successRate * 100).toFixed(1);
  return (
    `${icon} ${summary.url}\n` +
    `   Status: ${summary.status} | Success: ${rate}% | ` +
    `Checks: ${summary.totalChecks} | Failed: ${summary.failedChecks} | ` +
    `Avg: ${summary.avgDurationMs}ms`
  );
}

export function formatHealthReport(summaries: HealthSummary[]): string {
  if (summaries.length === 0) return "No health data available.";

  const lines = ["=== RouteWatch Health Report ==="];
  for (const s of summaries) {
    lines.push(formatHealthEntry(s));
  }

  const down = summaries.filter(s => s.status === "down").length;
  const degraded = summaries.filter(s => s.status === "degraded").length;
  lines.push("");
  lines.push(`Summary: ${summaries.length} endpoints — ${down} down, ${degraded} degraded`);
  return lines.join("\n");
}

export function healthToJson(summaries: HealthSummary[]): string {
  return JSON.stringify(summaries, null, 2);
}
