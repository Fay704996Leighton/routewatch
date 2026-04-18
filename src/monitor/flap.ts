// Flap detection: identifies endpoints that oscillate between healthy and unhealthy states

export interface FlapEntry {
  url: string;
  transitions: number;
  firstSeen: number;
  lastSeen: number;
  isFlapping: boolean;
}

export interface FlapReport {
  generatedAt: number;
  entries: FlapEntry[];
  flappingCount: number;
}

export interface FlapState {
  history: Map<string, boolean[]>;
  windowSize: number;
  threshold: number;
}

export function createFlapDetector(windowSize = 10, threshold = 4): FlapState {
  return { history: new Map(), windowSize, threshold };
}

export function recordFlapStatus(
  state: FlapState,
  url: string,
  healthy: boolean
): void {
  const hist = state.history.get(url) ?? [];
  hist.push(healthy);
  if (hist.length > state.windowSize) hist.shift();
  state.history.set(url, hist);
}

export function countTransitions(statuses: boolean[]): number {
  let count = 0;
  for (let i = 1; i < statuses.length; i++) {
    if (statuses[i] !== statuses[i - 1]) count++;
  }
  return count;
}

export function buildFlapReport(
  state: FlapState,
  timestamps: Map<string, { first: number; last: number }>
): FlapReport {
  const now = Date.now();
  const entries: FlapEntry[] = [];

  for (const [url, hist] of state.history.entries()) {
    const transitions = countTransitions(hist);
    const isFlapping = hist.length >= state.windowSize && transitions >= state.threshold;
    const ts = timestamps.get(url) ?? { first: now, last: now };
    entries.push({ url, transitions, firstSeen: ts.first, lastSeen: ts.last, isFlapping });
  }

  return {
    generatedAt: now,
    entries,
    flappingCount: entries.filter((e) => e.isFlapping).length,
  };
}

export function flapToJson(report: FlapReport): string {
  return JSON.stringify(report, null, 2);
}
