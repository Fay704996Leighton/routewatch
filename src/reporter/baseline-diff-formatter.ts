import { BaselineDiff, BaselineDiffEntry } from "../monitor/baseline-diff";

export function formatDiffEntry(entry: BaselineDiffEntry): string {
  const sign = entry.delta >= 0 ? "+" : "";
  const pct = `${sign}${entry.deltaPercent.toFixed(1)}%`;
  return (
    `  ${entry.field.padEnd(14)} ` +
    `${entry.previous.toFixed(2).padStart(8)} → ` +
    `${entry.current.toFixed(2).padStart(8)}  (${pct})`
  );
}

export function formatBaselineDiffReport(diff: BaselineDiff): string {
  if (!diff.hasChanges) return "Baseline Diff: no changes.";

  const grouped: Record<string, BaselineDiffEntry[]> = {};
  for (const e of diff.entries) {
    if (!grouped[e.url]) grouped[e.url] = [];
    grouped[e.url].push(e);
  }

  const lines: string[] = [`Baseline Diff Report — ${diff.timestamp}`, ""];
  for (const [url, entries] of Object.entries(grouped)) {
    lines.push(`  ${url}`);
    for (const e of entries) {
      lines.push(formatDiffEntry(e));
    }
    lines.push("");
  }
  return lines.join("\n").trimEnd();
}

export function baselineDiffReportToJson(diff: BaselineDiff): string {
  return JSON.stringify(
    {
      timestamp: diff.timestamp,
      hasChanges: diff.hasChanges,
      count: diff.entries.length,
      entries: diff.entries,
    },
    null,
    2
  );
}

export function baselineDiffSummaryLine(diff: BaselineDiff): string {
  if (!diff.hasChanges) return "baseline: no drift";
  const urls = new Set(diff.entries.map((e) => e.url)).size;
  return `baseline: ${diff.entries.length} change(s) across ${urls} route(s)`;
}
