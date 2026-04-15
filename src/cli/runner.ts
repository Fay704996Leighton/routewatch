import { loadConfig } from '../config/loader';
import { fetchEndpoint } from '../monitor/fetcher';
import { analyzeResponseTimes } from '../monitor/analyzer';
import { checkSchemaDrift } from '../monitor/schema-checker';
import { formatReport } from '../reporter/formatter';
import { writeReport, writeReportToStdout } from '../reporter/writer';
import type { ReportEntry } from '../monitor/types';

export interface RunOptions {
  configPath: string;
  outputPath?: string;
  silent?: boolean;
}

export async function run(options: RunOptions): Promise<ReportEntry[]> {
  const config = await loadConfig(options.configPath);
  const entries: ReportEntry[] = [];

  for (const endpoint of config.endpoints) {
    const samples = await fetchEndpoint(endpoint, config.runs ?? 3);
    const analysis = analyzeResponseTimes(samples, endpoint.thresholds);
    const schemaDrift = endpoint.schema
      ? checkSchemaDrift(samples[samples.length - 1]?.body ?? {}, endpoint.schema)
      : { driftedKeys: [], missingKeys: [] };

    entries.push({
      url: endpoint.url,
      method: endpoint.method ?? 'GET',
      samples,
      analysis,
      schemaDrift,
    });
  }

  const report = formatReport(entries);

  if (!options.silent) {
    writeReportToStdout(report);
  }

  if (options.outputPath) {
    await writeReport(report, options.outputPath);
  }

  return entries;
}
