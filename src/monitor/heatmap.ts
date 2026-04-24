import type { PollResult } from "./types";

export interface HeatmapCell {
  hour: number; // 0-23
  day: number;  // 0=Sun, 6=Sat
  count: number;
  avgDuration: number;
  errorRate: number;
}

export interface HeatmapEntry {
  url: string;
  cells: HeatmapCell[];
}

export interface HeatmapReport {
  generatedAt: string;
  entries: HeatmapEntry[];
}

interface Accumulator {
  total: number;
  durationSum: number;
  errors: number;
}

export function buildHeatmapEntry(url: string, results: PollResult[]): HeatmapEntry {
  const map = new Map<string, Accumulator>();

  for (const r of results) {
    const d = new Date(r.timestamp);
    const hour = d.getUTCHours();
    const day = d.getUTCDay();
    const key = `${day}:${hour}`;
    const acc = map.get(key) ?? { total: 0, durationSum: 0, errors: 0 };
    acc.total += 1;
    acc.durationSum += r.status === "success" ? (r.duration ?? 0) : 0;
    if (r.status === "error" || r.status === "failed") acc.errors += 1;
    map.set(key, acc);
  }

  const cells: HeatmapCell[] = Array.from(map.entries()).map(([key, acc]) => {
    const [day, hour] = key.split(":").map(Number);
    return {
      hour,
      day,
      count: acc.total,
      avgDuration: acc.total > 0 ? Math.round(acc.durationSum / acc.total) : 0,
      errorRate: acc.total > 0 ? acc.errors / acc.total : 0,
    };
  });

  cells.sort((a, b) => a.day !== b.day ? a.day - b.day : a.hour - b.hour);

  return { url, cells };
}

export function buildHeatmapReport(results: PollResult[]): HeatmapReport {
  const grouped = new Map<string, PollResult[]>();
  for (const r of results) {
    const list = grouped.get(r.url) ?? [];
    list.push(r);
    grouped.set(r.url, list);
  }

  const entries = Array.from(grouped.entries()).map(([url, rs]) =>
    buildHeatmapEntry(url, rs)
  );

  return { generatedAt: new Date().toISOString(), entries };
}

export function heatmapToJson(report: HeatmapReport): string {
  return JSON.stringify(report, null, 2);
}

export function formatHeatmapReport(report: HeatmapReport): string {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const lines: string[] = [`Heatmap Report — ${report.generatedAt}`, ""];

  for (const entry of report.entries) {
    lines.push(`  ${entry.url}`);
    for (const cell of entry.cells) {
      const errPct = (cell.errorRate * 100).toFixed(1);
      lines.push(
        `    ${days[cell.day]} ${String(cell.hour).padStart(2, "0")}:00` +
        `  count=${cell.count}  avg=${cell.avgDuration}ms  errors=${errPct}%`
      );
    }
    lines.push("");
  }

  return lines.join("\n");
}
