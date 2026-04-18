import { loadHistory } from '../monitor/history';
import { buildProfileEntry, buildProfileReport, profileToJson } from '../monitor/profiler';
import { formatProfileReport } from '../reporter/profiler-formatter';
import { HistoryEntry } from '../monitor/history';

export interface ProfilerCommandOptions {
  historyFile: string;
  format: 'text' | 'json';
  url?: string;
}

function groupByUrl(entries: HistoryEntry[]): Map<string, HistoryEntry[]> {
  const map = new Map<string, HistoryEntry[]>();
  for (const e of entries) {
    const key = `${e.method ?? 'GET'}::${e.url}`;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(e);
  }
  return map;
}

export async function runProfilerCommand(opts: ProfilerCommandOptions): Promise<void> {
  const history = await loadHistory(opts.historyFile);

  const filtered = opts.url
    ? history.filter((e) => e.url === opts.url)
    : history;

  const grouped = groupByUrl(filtered);

  const profileEntries = Array.from(grouped.entries()).map(([key, entries]) => {
    const [method, url] = key.split('::');
    const durations = entries.map((e) => e.duration);
    return buildProfileEntry(url, method, durations);
  });

  const report = buildProfileReport(profileEntries);

  if (opts.format === 'json') {
    console.log(profileToJson(report));
  } else {
    console.log(formatProfileReport(report));
  }
}
