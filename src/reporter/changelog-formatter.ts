import {
  ChangelogReport,
  ChangelogEntry,
  formatChangelogReport,
  changelogToJson,
} from "../monitor/changelog";

export { formatChangelogReport, changelogToJson };

export function formatChangelogEntry(entry: ChangelogEntry): string {
  const tag = entry.tag ? ` [${entry.tag}]` : "";
  return `${entry.timestamp} [${entry.severity.toUpperCase()}]${tag} ${entry.url} — ${entry.message}`;
}

export function changelogReportToText(report: ChangelogReport): string {
  if (report.entries.length === 0) {
    return `Changelog generated at ${report.generatedAt}: no entries.\n`;
  }
  const header = `Changelog — ${report.generatedAt}\n${"-".repeat(60)}`;
  const rows = report.entries.map(formatChangelogEntry).join("\n");
  return `${header}\n${rows}\n`;
}

export function changelogSummaryLine(report: ChangelogReport): string {
  const counts: Record<string, number> = { info: 0, warning: 0, critical: 0 };
  for (const e of report.entries) counts[e.severity] = (counts[e.severity] ?? 0) + 1;
  return (
    `Changelog: ${report.entries.length} entr${report.entries.length === 1 ? "y" : "ies"} — ` +
    `critical=${counts.critical} warning=${counts.warning} info=${counts.info}`
  );
}
