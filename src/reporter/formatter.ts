import { AnalysisResult } from '../monitor/analyzer';
import { SchemaDriftResult } from '../monitor/schema-checker';

export interface ReportEntry {
  endpoint: string;
  timestamp: string;
  analysisResult: AnalysisResult;
  schemaDriftResult: SchemaDriftResult;
}

export type OutputFormat = 'text' | 'json';

export function formatReport(entries: ReportEntry[], format: OutputFormat): string {
  if (format === 'json') {
    return JSON.stringify(entries, null, 2);
  }
  return entries.map(formatTextEntry).join('\n' + '-'.repeat(60) + '\n');
}

function formatTextEntry(entry: ReportEntry): string {
  const lines: string[] = [];
  lines.push(`Endpoint : ${entry.endpoint}`);
  lines.push(`Timestamp: ${entry.timestamp}`);

  const ar = entry.analysisResult;
  lines.push(`Avg Response Time : ${ar.averageDuration.toFixed(2)} ms`);
  lines.push(`Regression Detected: ${ar.regressionDetected ? 'YES ⚠️' : 'no'}`);
  if (ar.regressionDetected) {
    lines.push(`  Baseline Avg: ${ar.baselineAverage?.toFixed(2)} ms`);
    lines.push(`  Current  Avg: ${ar.currentAverage?.toFixed(2)} ms`);
  }

  const sd = entry.schemaDriftResult;
  lines.push(`Schema Drift: ${sd.hasDrift ? 'YES ⚠️' : 'no'}`);
  if (sd.addedKeys.length)   lines.push(`  Added keys  : ${sd.addedKeys.join(', ')}`);
  if (sd.removedKeys.length) lines.push(`  Removed keys: ${sd.removedKeys.join(', ')}`);

  return lines.join('\n');
}
