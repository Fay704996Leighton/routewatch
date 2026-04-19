import { DependencyGraph, findImpacted } from '../monitor/dependency';

export interface ImpactSummary {
  failedUrl: string;
  impacted: string[];
  impactCount: number;
}

export function buildImpactSummary(
  graph: DependencyGraph,
  failedUrls: string[]
): ImpactSummary[] {
  return failedUrls.map((url) => {
    const impacted = findImpacted(graph, url);
    return { failedUrl: url, impacted, impactCount: impacted.length };
  });
}

export function formatImpactEntry(summary: ImpactSummary): string {
  const lines = [`  [FAILED] ${summary.failedUrl}`];
  if (summary.impacted.length === 0) {
    lines.push('    No downstream impact detected.');
  } else {
    lines.push(`    Impacted (${summary.impactCount}):`);
    for (const url of summary.impacted) {
      lines.push(`      - ${url}`);
    }
  }
  return lines.join('\n');
}

export function formatImpactReport(summaries: ImpactSummary[]): string {
  if (summaries.length === 0) return 'No failures to report.';
  const lines = ['Impact Report:', ''];
  for (const s of summaries) {
    lines.push(formatImpactEntry(s));
  }
  return lines.join('\n');
}

export function impactToJson(summaries: ImpactSummary[]): string {
  return JSON.stringify(summaries, null, 2);
}
