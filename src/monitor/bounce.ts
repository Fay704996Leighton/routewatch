// bounce.ts — detects endpoints that repeatedly fail and recover (bouncing)

export interface BounceEntry {
  url: string;
  bounceCount: number;
  lastSeen: string;
  windowMs: number;
}

export interface BounceReport {
  generatedAt: string;
  entries: BounceEntry[];
}

export interface BounceState {
  transitions: number[];
  windowMs: number;
}

export function createBounceDetector(windowMs = 60_000): Map<string, BounceState> {
  return new Map();
}

export function recordBounce(
  store: Map<string, BounceState>,
  url: string,
  status: "up" | "down",
  windowMs = 60_000
): void {
  const now = Date.now();
  if (!store.has(url)) {
    store.set(url, { transitions: [], windowMs });
  }
  const entry = store.get(url)!;
  entry.transitions.push(now);
  // purge old entries outside window
  entry.transitions = entry.transitions.filter(t => now - t <= windowMs);
}

export function countBounces(store: Map<string, BounceState>, url: string): number {
  const entry = store.get(url);
  if (!entry) return 0;
  const now = Date.now();
  return entry.transitions.filter(t => now - t <= entry.windowMs).length;
}

export function buildBounceReport(
  store: Map<string, BounceState>
): BounceReport {
  const now = Date.now();
  const entries: BounceEntry[] = [];
  for (const [url, state] of store.entries()) {
    const recent = state.transitions.filter(t => now - t <= state.windowMs);
    if (recent.length > 0) {
      entries.push({
        url,
        bounceCount: recent.length,
        lastSeen: new Date(recent[recent.length - 1]).toISOString(),
        windowMs: state.windowMs,
      });
    }
  }
  return {
    generatedAt: new Date().toISOString(),
    entries: entries.sort((a, b) => b.bounceCount - a.bounceCount),
  };
}

export function bounceToJson(report: BounceReport): string {
  return JSON.stringify(report, null, 2);
}

export function formatBounceReport(report: BounceReport): string {
  if (report.entries.length === 0) return "No bouncing endpoints detected.\n";
  const lines = ["Bounce Report", "=============="];
  for (const e of report.entries) {
    lines.push(`${e.url} — ${e.bounceCount} transitions in ${e.windowMs}ms window (last: ${e.lastSeen})`);
  }
  return lines.join("\n") + "\n";
}
