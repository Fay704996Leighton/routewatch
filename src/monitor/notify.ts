import { Alert } from "./alert";

export type NotifyChannel = "console" | "webhook" | "file";

export interface NotifyRule {
  channel: NotifyChannel;
  minSeverity: "low" | "medium" | "high";
  target?: string; // webhook URL or file path
}

export interface NotifyResult {
  channel: NotifyChannel;
  sent: number;
  skipped: number;
  errors: string[];
}

const SEVERITY_RANK: Record<string, number> = { low: 0, medium: 1, high: 2 };

function meetsMinSeverity(alert: Alert, min: "low" | "medium" | "high"): boolean {
  return (SEVERITY_RANK[alert.severity] ?? 0) >= (SEVERITY_RANK[min] ?? 0);
}

export function buildNotifyResults(
  alerts: Alert[],
  rules: NotifyRule[]
): NotifyResult[] {
  return rules.map((rule) => {
    const eligible = alerts.filter((a) => meetsMinSeverity(a, rule.minSeverity));
    const errors: string[] = [];

    if (rule.channel === "webhook" && !rule.target) {
      errors.push("webhook channel requires a target URL");
      return { channel: rule.channel, sent: 0, skipped: eligible.length, errors };
    }

    if (rule.channel === "file" && !rule.target) {
      errors.push("file channel requires a target path");
      return { channel: rule.channel, sent: 0, skipped: eligible.length, errors };
    }

    return {
      channel: rule.channel,
      sent: eligible.length,
      skipped: alerts.length - eligible.length,
      errors,
    };
  });
}

export function formatNotifyResults(results: NotifyResult[]): string {
  if (results.length === 0) return "No notification rules configured.";
  return results
    .map(
      (r) =>
        `[${r.channel}] sent=${r.sent} skipped=${r.skipped}` +
        (r.errors.length ? ` errors=${r.errors.join("; ")}` : "")
    )
    .join("\n");
}
