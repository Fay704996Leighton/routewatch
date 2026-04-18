export interface PauseEntry {
  url: string;
  pausedAt: number;
  resumeAt: number | null;
  reason: string;
}

export interface PauseStore {
  entries: PauseEntry[];
}

export function createPauseStore(): PauseStore {
  return { entries: [] };
}

export function pauseRoute(
  store: PauseStore,
  url: string,
  reason: string,
  durationMs?: number
): PauseEntry {
  const now = Date.now();
  const entry: PauseEntry = {
    url,
    pausedAt: now,
    resumeAt: durationMs != null ? now + durationMs : null,
    reason,
  };
  store.entries = store.entries.filter((e) => e.url !== url);
  store.entries.push(entry);
  return entry;
}

export function resumeRoute(store: PauseStore, url: string): boolean {
  const before = store.entries.length;
  store.entries = store.entries.filter((e) => e.url !== url);
  return store.entries.length < before;
}

export function isPaused(store: PauseStore, url: string, now = Date.now()): boolean {
  const entry = store.entries.find((e) => e.url === url);
  if (!entry) return false;
  if (entry.resumeAt !== null && now >= entry.resumeAt) {
    store.entries = store.entries.filter((e) => e.url !== url);
    return false;
  }
  return true;
}

export function purgeExpiredPauses(store: PauseStore, now = Date.now()): number {
  const before = store.entries.length;
  store.entries = store.entries.filter(
    (e) => e.resumeAt === null || now < e.resumeAt
  );
  return before - store.entries.length;
}

export function listPaused(store: PauseStore, now = Date.now()): PauseEntry[] {
  purgeExpiredPauses(store, now);
  return [...store.entries];
}
