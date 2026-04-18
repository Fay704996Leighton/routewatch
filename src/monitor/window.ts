/**
 * Sliding window aggregator for poll results.
 * Keeps the last N entries per route and computes basic stats.
 */

export interface WindowEntry {
  route: string;
  durationMs: number;
  timestamp: number;
}

export interface WindowStats {
  route: string;
  count: number;
  min: number;
  max: number;
  avg: number;
  p95: number;
}

export interface SlidingWindow {
  add(entry: WindowEntry): void;
  stats(route: string): WindowStats | null;
  all(route: string): WindowEntry[];
  clear(route: string): void;
}

export function createSlidingWindow(maxSize: number = 100): SlidingWindow {
  const store = new Map<string, WindowEntry[]>();

  function getOrCreate(route: string): WindowEntry[] {
    if (!store.has(route)) store.set(route, []);
    return store.get(route)!;
  }

  function add(entry: WindowEntry): void {
    const buf = getOrCreate(entry.route);
    buf.push(entry);
    if (buf.length > maxSize) buf.shift();
  }

  function stats(route: string): WindowStats | null {
    const buf = store.get(route);
    if (!buf || buf.length === 0) return null;
    const durations = buf.map((e) => e.durationMs).sort((a, b) => a - b);
    const sum = durations.reduce((a, b) => a + b, 0);
    const p95Index = Math.floor(durations.length * 0.95);
    return {
      route,
      count: durations.length,
      min: durations[0],
      max: durations[durations.length - 1],
      avg: sum / durations.length,
      p95: durations[Math.min(p95Index, durations.length - 1)],
    };
  }

  function all(route: string): WindowEntry[] {
    return store.get(route) ?? [];
  }

  function clear(route: string): void {
    store.delete(route);
  }

  return { add, stats, all, clear };
}
