import * as fs from 'fs';
import * as path from 'path';
import { ReportEntry, OutputFormat, formatReport } from './formatter';

export interface WriterOptions {
  outputDir: string;
  format: OutputFormat;
}

export function writeReport(entries: ReportEntry[], options: WriterOptions): string {
  const { outputDir, format } = options;

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const ext = format === 'json' ? 'json' : 'txt';
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `report-${timestamp}.${ext}`;
  const filepath = path.join(outputDir, filename);

  const content = formatReport(entries, format);
  fs.writeFileSync(filepath, content, 'utf-8');

  return filepath;
}

export function writeReportToStdout(entries: ReportEntry[], format: OutputFormat): void {
  const content = formatReport(entries, format);
  process.stdout.write(content + '\n');
}
