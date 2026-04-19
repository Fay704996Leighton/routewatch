import { BaselineEntry } from "./baseline";

export interface BaselineDiffEntry {
  url: string;
  field: "avgDuration" | "p95" | "successRate";
  previous: number;
  current: number;
  delta: number;
  deltaPercent: number;
}

export interface BaselineDiff {
  timestamp: string;
  entries: BaselineDiffEntry[];
  hasChanges: boolean;
}

function diffField(
  url: string,
  field: BaselineDiffEntry["field"],
  prev: number,
  curr: number
): BaselineDiffEntry | null {
  const delta = curr - prev;
  const deltaPercent = prev === 0 ? 0 : (delta / prev) * 100;
  if (Math.abs(deltaPercent) < 0.01) return null;
  return { url, field, previous: prev, current: curr, delta, deltaPercent };
}

export function diffBaselines(
  previous: Record<string, BaselineEntry>,
  current: Record<string, BaselineEntry>
): BaselineDiff {
  const entries: BaselineDiffEntry[] = [];

  for (const url of Object.keys(current)) {
    const prev = previous[url];
    const curr = current[url];
    if (!prev) continue;

    const checks: Array<[BaselineDiffEntry["field"], number, number]> = [
      ["avgDuration", prev.avgDuration, curr.avgDuration],
      ["p95", prev.p95, curr.p95],
      ["successRate", prev.successRate, curr.successRate],
    ];

    for (const [field, p, c] of checks) {
      const entry = diffField(url, field, p, c);
      if (entry) entries.push(entry);
    }
  }

  return {
    timestamp: new Date().toISOString(),
    entries,
    hasChanges: entries.length > 0,
  };
}

export function formatBaselineDiff(diff: BaselineDiff): string {
  if (!diff.hasChanges) return "No baseline changes detected.";
  const lines = [`Baseline Diff — ${diff.timestamp}`, ""];
  for (const e of diff.entries) {
    const sign = e.delta >= 0 ? "+" : "";
    lines.push(
      `  [${e.url}] ${e.field}: ${e.previous.toFixed(2)} → ${e.current.toFixed(2)} (${sign}${e.deltaPercent.toFixed(1)}%)`
    );
  }
  return lines.join("\n");
}

export function baselineDiffToJson(diff: BaselineDiff): string {
  return JSON.stringify(diff, null, 2);
}
