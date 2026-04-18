import { EscalationReport, EscalationEntry, EscalationLevel } from "../monitor/escalation";

const LEVEL_LABEL: Record<EscalationLevel, string> = {
  low: "🟢 LOW",
  medium: "🟡 MEDIUM",
  high: "🟠 HIGH",
  critical: "🔴 CRITICAL",
};

export function formatEscalationEntry(entry: EscalationEntry): string {
  const first = new Date(entry.firstSeen).toISOString();
  const last = new Date(entry.lastSeen).toISOString();
  return [
    `  Key:         ${entry.alertKey}`,
    `  Level:       ${LEVEL_LABEL[entry.level]}`,
    `  Occurrences: ${entry.occurrences}`,
    `  First Seen:  ${first}`,
    `  Last Seen:   ${last}`,
  ].join("\n");
}

export function formatEscalationReport(report: EscalationReport): string {
  if (report.entries.length === 0) {
    return `Escalation Report — ${report.generatedAt}\nNo escalations.`;
  }
  const lines = [`Escalation Report — ${report.generatedAt}`, ""];
  for (const entry of report.entries) {
    lines.push(formatEscalationEntry(entry));
    lines.push("");
  }
  return lines.join("\n").trimEnd();
}

export function escalationToJson(report: EscalationReport): string {
  return JSON.stringify(report, null, 2);
}
