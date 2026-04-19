import { MaintenanceWindow } from "../monitor/maintenance";

export interface MaintenanceReport {
  generatedAt: string;
  total: number;
  windows: MaintenanceWindow[];
}

export function buildMaintenanceReport(
  windows: MaintenanceWindow[]
): MaintenanceReport {
  return {
    generatedAt: new Date().toISOString(),
    total: windows.length,
    windows,
  };
}

export function formatMaintenanceEntry(w: MaintenanceWindow): string {
  const reason = w.reason ? ` — ${w.reason}` : "";
  return `  [${w.id}] ${w.route}\n    from ${w.start.toISOString()} to ${w.end.toISOString()}${reason}`;
}

export function formatMaintenanceReport(report: MaintenanceReport): string {
  const lines: string[] = [
    `Maintenance Windows (${report.total}) — ${report.generatedAt}`,
    "-".repeat(52),
  ];
  if (report.total === 0) {
    lines.push("  No maintenance windows scheduled.");
  } else {
    for (const w of report.windows) {
      lines.push(formatMaintenanceEntry(w));
    }
  }
  return lines.join("\n");
}

export function maintenanceToJson(report: MaintenanceReport): string {
  return JSON.stringify(
    {
      ...report,
      windows: report.windows.map((w) => ({
        ...w,
        start: w.start.toISOString(),
        end: w.end.toISOString(),
      })),
    },
    null,
    2
  );
}
