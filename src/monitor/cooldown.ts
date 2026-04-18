/**
 * Cooldown tracker: suppresses repeated alerts for a route within a time window.
 */

export interface CooldownEntry {
  lastAlertAt: number;
  count: number;
}

export interface CooldownTracker {
  isOnCooldown(key: string): boolean;
  record(key: string): void;
  reset(key: string): void;
  stats(key: string): CooldownEntry | undefined;
  purgeExpired(): void;
}

export function createCooldownTracker(
  windowMs: number
): CooldownTracker {
  const entries = new Map<string, CooldownEntry>();

  function isOnCooldown(key: string): boolean {
    const entry = entries.get(key);
    if (!entry) return false;
    return Date.now() - entry.lastAlertAt < windowMs;
  }

  function record(key: string): void {
    const existing = entries.get(key);
    if (existing) {
      existing.lastAlertAt = Date.now();
      existing.count += 1;
    } else {
      entries.set(key, { lastAlertAt: Date.now(), count: 1 });
    }
  }

  function reset(key: string): void {
    entries.delete(key);
  }

  function stats(key: string): CooldownEntry | undefined {
    return entries.get(key);
  }

  function purgeExpired(): void {
    const now = Date.now();
    for (const [key, entry] of entries) {
      if (now - entry.lastAlertAt >= windowMs) {
        entries.delete(key);
      }
    }
  }

  return { isOnCooldown, record, reset, stats, purgeExpired };
}
