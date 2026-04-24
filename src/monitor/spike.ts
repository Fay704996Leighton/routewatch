/**
 * Spike detection: identifies sudden short-lived latency spikes
 * that may not be caught by trend or anomaly analysis.
 */

export interface SpikeEntry {
  url: string;
  timestamp: string;
  duration: number;
  baselineAvg: number;
  ratio: number;
  isSpike: boolean;
}

export interface SpikeReport {
  generatedAt: string;
  spikeThresholdRatio: number;
  entries: SpikeEntry[];
  spikeCount: number;
}

/** Returns true if duration exceeds baselineAvg * thresholdRatio */
export function isSpike(duration: number, baselineAvg: number, thresholdRatio: number): boolean {
  if (baselineAvg <= 0) return false;
  return duration / baselineAvg >= thresholdRatio;
}

export function buildSpikeEntry(
  url: string,
  duration: number,
  baselineAvg: number,
  thresholdRatio: number,
  timestamp: string = new Date().toISOString()
): SpikeEntry {
  const ratio = baselineAvg > 0 ? duration / baselineAvg : 0;
  return {
    url,
    timestamp,
    duration,
    baselineAvg,
    ratio: Math.round(ratio * 100) / 100,
    isSpike: isSpike(duration, baselineAvg, thresholdRatio),
  };
}

export function buildSpikeReport(
  entries: SpikeEntry[],
  thresholdRatio: number = 3.0
): SpikeReport {
  return {
    generatedAt: new Date().toISOString(),
    spikeThresholdRatio: thresholdRatio,
    entries,
    spikeCount: entries.filter((e) => e.isSpike).length,
  };
}

export function spikeToJson(report: SpikeReport): string {
  return JSON.stringify(report, null, 2);
}

export function formatSpikeReport(report: SpikeReport): string {
  const lines: string[] = [
    `Spike Report — ${report.generatedAt}`,
    `Threshold Ratio : ${report.spikeThresholdRatio}x`,
    `Spikes Detected : ${report.spikeCount} / ${report.entries.length}`,
    ``,
  ];
  for (const e of report.entries) {
    const flag = e.isSpike ? "[SPIKE]" : "[ok]   ";
    lines.push(
      `${flag} ${e.url}  ${e.duration}ms  (${e.ratio}x baseline avg ${e.baselineAvg}ms)  @ ${e.timestamp}`
    );
  }
  return lines.join("\n");
}
