import { Alert } from "./alert";

export type EscalationLevel = "low" | "medium" | "high" | "critical";

export interface EscalationRule {
  minOccurrences: number;
  withinMs: number;
  escalateTo: EscalationLevel;
}

export interface EscalationEntry {
  alertKey: string;
  level: EscalationLevel;
  occurrences: number;
  firstSeen: number;
  lastSeen: number;
}

export interface EscalationReport {
  generatedAt: string;
  entries: EscalationEntry[];
}

const DEFAULT_RULES: EscalationRule[] = [
  { minOccurrences: 1, withinMs: Infinity, escalateTo: "low" },
  { minOccurrences: 3, withinMs: 5 * 60_000, escalateTo: "medium" },
  { minOccurrences: 5, withinMs: 5 * 60_000, escalateTo: "high" },
  { minOccurrences: 10, withinMs: 10 * 60_000, escalateTo: "critical" },
];

export function resolveEscalationLevel(
  occurrences: number,
  windowMs: number,
  rules: EscalationRule[] = DEFAULT_RULES
): EscalationLevel {
  let level: EscalationLevel = "low";
  for (const rule of rules) {
    if (occurrences >= rule.minOccurrences && windowMs <= rule.withinMs) {
      level = rule.escalateTo;
    }
  }
  return level;
}

export function buildEscalationReport(
  alerts: Alert[],
  rules?: EscalationRule[]
): EscalationReport {
  const map = new Map<string, { times: number[]; severity: string }>();

  for (const alert of alerts) {
    const key = `${alert.url}::${alert.type}`;
    if (!map.has(key)) map.set(key, { times: [], severity: alert.severity });
    map.get(key)!.times.push(Date.now());
  }

  const entries: EscalationEntry[] = [];
  for (const [alertKey, { times }] of map) {
    const sorted = [...times].sort((a, b) => a - b);
    const windowMs = sorted.length > 1 ? sorted[sorted.length - 1] - sorted[0] : 0;
    entries.push({
      alertKey,
      level: resolveEscalationLevel(sorted.length, windowMs, rules),
      occurrences: sorted.length,
      firstSeen: sorted[0],
      lastSeen: sorted[sorted.length - 1],
    });
  }

  return { generatedAt: new Date().toISOString(), entries };
}
