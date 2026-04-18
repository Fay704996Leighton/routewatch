import { readFileSync, writeFileSync, existsSync } from "fs";

export interface MuteRule {
  url: string;
  reason: string;
  mutedAt: number;
  expiresAt: number | null;
}

export interface MuteStore {
  rules: MuteRule[];
}

export function createMuteStore(path: string): {
  muteRoute: (url: string, reason: string, ttlMs?: number) => void;
  unmuteRoute: (url: string) => void;
  isMuted: (url: string) => boolean;
  purgeExpired: () => void;
  list: () => MuteRule[];
} {
  function load(): MuteStore {
    if (!existsSync(path)) return { rules: [] };
    return JSON.parse(readFileSync(path, "utf-8"));
  }

  function save(store: MuteStore): void {
    writeFileSync(path, JSON.stringify(store, null, 2));
  }

  function muteRoute(url: string, reason: string, ttlMs?: number): void {
    const store = load();
    const now = Date.now();
    store.rules = store.rules.filter((r) => r.url !== url);
    store.rules.push({
      url,
      reason,
      mutedAt: now,
      expiresAt: ttlMs != null ? now + ttlMs : null,
    });
    save(store);
  }

  function unmuteRoute(url: string): void {
    const store = load();
    store.rules = store.rules.filter((r) => r.url !== url);
    save(store);
  }

  function isMuted(url: string): boolean {
    const store = load();
    const now = Date.now();
    return store.rules.some(
      (r) => r.url === url && (r.expiresAt === null || r.expiresAt > now)
    );
  }

  function purgeExpired(): void {
    const store = load();
    const now = Date.now();
    store.rules = store.rules.filter(
      (r) => r.expiresAt === null || r.expiresAt > now
    );
    save(store);
  }

  function list(): MuteRule[] {
    const store = load();
    return store.rules;
  }

  return { muteRoute, unmuteRoute, isMuted, purgeExpired, list };
}
