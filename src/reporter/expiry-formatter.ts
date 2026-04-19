/**
 * Formats expiry reports for output (text and JSON).
 */

import { ExpiryReport, ExpiryEntry } from "../monitor/expiry";

/** Format a single expiry entry as a human-readable string */
export function formatExpiryEntry(entry: ExpiryEntry): string {
  const status = entry.expired ? "EXPIRED" : "OK";
  const ttlInfo = entry.ttlDays !== undefined
    ? `TTL: ${entry.ttlDays}d remaining`
    : "no expiry info";
  return `[${status}] ${entry.url} — ${ttlInfo} (checked: ${entry.checkedAt})`;
}

/** Format a full expiry report as plain text */
export function formatExpiryReportText(report: ExpiryReport): string {
  const lines: string[] = [
    `Expiry Report — ${report.generatedAt}`,
    `Routes checked: ${report.totalChecked}`,
    `Expired: ${report.totalExpired}`,
    "",
  ];

  if (report.entries.length === 0) {
    lines.push("No expiry data available.");
    return lines.join("\n");
  }

  const expired = report.entries.filter((e) => e.expired);
  const ok = report.entries.filter((e) => !e.expired);

  if (expired.length > 0) {
    lines.push("--- Expired ---");
    expired.forEach((e) => lines.push(formatExpiryEntry(e)));
    lines.push("");
  }

  if (ok.length > 0) {
    lines.push("--- Active ---");
    ok.forEach((e) => lines.push(formatExpiryEntry(e)));
  }

  return lines.join("\n");
}

/** Summarise expiry report in a single line */
export function expirySummaryLine(report: ExpiryReport): string {
  return `Expiry: ${report.totalExpired}/${report.totalChecked} expired as of ${report.generatedAt}`;
}

/** Serialize expiry report to JSON string */
export function expiryReportToJson(report: ExpiryReport): string {
  return JSON.stringify(report, null, 2);
}
