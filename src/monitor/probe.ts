import { PollResult } from "./types";

export type ProbeStatus = "reachable" | "unreachable" | "degraded";

export interface ProbeEntry {
  url: string;
  status: ProbeStatus;
  latencyMs: number;
  checkedAt: string;
  statusCode?: number;
  error?: string;
}

export interface ProbeReport {
  entries: ProbeEntry[];
  reachable: number;
  unreachable: number;
  degraded: number;
  generatedAt: string;
}

export function classifyProbe(
  result: PollResult,
  degradedThresholdMs = 1000
): ProbeStatus {
  if (result.kind === "error" || result.kind === "failed") return "unreachable";
  if (result.durationMs >= degradedThresholdMs) return "degraded";
  return "reachable";
}

export function buildProbeEntry(
  result: PollResult,
  degradedThresholdMs = 1000
): ProbeEntry {
  const status = classifyProbe(result, degradedThresholdMs);
  return {
    url: result.url,
    status,
    latencyMs: result.durationMs,
    checkedAt: new Date().toISOString(),
    statusCode: result.kind === "success" ? result.statusCode : undefined,
    error: result.kind === "error" ? result.error : undefined,
  };
}

export function buildProbeReport(
  results: PollResult[],
  degradedThresholdMs = 1000
): ProbeReport {
  const entries = results.map((r) => buildProbeEntry(r, degradedThresholdMs));
  return {
    entries,
    reachable: entries.filter((e) => e.status === "reachable").length,
    unreachable: entries.filter((e) => e.status === "unreachable").length,
    degraded: entries.filter((e) => e.status === "degraded").length,
    generatedAt: new Date().toISOString(),
  };
}
