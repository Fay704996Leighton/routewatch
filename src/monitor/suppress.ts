// Alert suppression: mute alerts matching rules during maintenance windows

export interface SuppressRule {
  url?: string;
  tag?: string;
  until: number; // epoch ms
  reason?: string;
}

export interface SuppressStore {
  rules: SuppressRule[];
}

export function createSuppressStore(initial: SuppressRule[] = []): SuppressStore {
  return { rules: [...initial] };
}

export function addRule(store: SuppressStore, rule: SuppressRule): void {
  store.rules.push(rule);
}

export function purgeExpiredRules(store: SuppressStore, now = Date.now()): void {
  store.rules = store.rules.filter(r => r.until > now);
}

export function isSuppressed(
  store: SuppressStore,
  url: string,
  tags: string[] = [],
  now = Date.now()
): boolean {
  purgeExpiredRules(store, now);
  return store.rules.some(r => {
    if (r.until <= now) return false;
    if (r.url && r.url !== url) return false;
    if (r.tag && !tags.includes(r.tag)) return false;
    return true;
  });
}

export function filterSuppressed<T extends { url: string; tags?: string[] }>(
  store: SuppressStore,
  items: T[],
  now = Date.now()
): T[] {
  return items.filter(item => !isSuppressed(store, item.url, item.tags ?? [], now));
}

export function suppressStats(store: SuppressStore, now = Date.now()) {
  purgeExpiredRules(store, now);
  return { active: store.rules.length };
}
