import { loadConfig } from "../config/loader";
import { loadHistory } from "../monitor/history";
import { detectAnomalies } from "../monitor/anomaly";
import { buildAnomalyReport, formatAnomalyReport, anomalyToJson } from "../reporter/anomaly-formatter";
import { PollResult } from "../monitor/types";

export interface AnomalyCommandOptions {
  configPath: string;
  historyPath: string;
  zThreshold?: number;
  json?: boolean;
  onlyAnomalies?: boolean;
}

export async function runAnomalyCommand(options: AnomalyCommandOptions): Promise<void> {
  const config = await loadConfig(options.configPath);
  const history = await loadHistory(options.historyPath);

  const latestByRoute = new Map<string, PollResult>();
  for (const entry of history) {
    const key = `${entry.method}:${entry.url}`;
    latestByRoute.set(key, {
      url: entry.url,
      method: entry.method,
      status: entry.status as "success" | "error" | "failed",
      duration: entry.duration,
      statusCode: entry.statusCode,
      body: "",
      timestamp: entry.timestamp,
    });
  }

  const results = Array.from(latestByRoute.values());
  const threshold = options.zThreshold ?? 2.5;
  const anomalies = detectAnomalies(results, history, threshold);

  let entries = buildAnomalyReport(anomalies);
  if (options.onlyAnomalies) {
    entries = entries.filter((e) => e.isAnomaly);
  }

  if (options.json) {
    process.stdout.write(anomalyToJson(entries) + "\n");
  } else {
    process.stdout.write(formatAnomalyReport(entries) + "\n");
  }
}
