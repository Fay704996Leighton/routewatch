/**
 * Quota tracker: counts requests per endpoint within a rolling window
 * and flags when a configured limit is exceeded.
 */

export interface QuotaConfig {
  windowMs: number;
  maxRequests: number;
}

export interface QuotaEntry {
  url: string;
  count: number;
  windowStart: number;
}

export interface QuotaResult {
  url: string;
  count: number;
  limit: number;
  exceeded: boolean;
  resetsAt: number;
}

export function createQuotaTracker(config: QuotaConfig) {
  const entries = new Map<string, QuotaEntry>();

  function getOrCreate(url: string, now: number): QuotaEntry {
    const existing = entries.get(url);
    if (!existing || now - existing.windowStart >= config.windowMs) {
      const entry: QuotaEntry = { url, count: 0, windowStart: now };
      entries.set(url, entry);
      return entry;
    }
    return existing;
  }

  function record(url: string, now = Date.now()): QuotaResult {
    const entry = getOrCreate(url, now);
    entry.count += 1;
    return {
      url,
      count: entry.count,
      limit: config.maxRequests,
      exceeded: entry.count > config.maxRequests,
      resetsAt: entry.windowStart + config.windowMs,
    };
  }

  function check(url: string, now = Date.now()): QuotaResult {
    const entry = getOrCreate(url, now);
    return {
      url,
      count: entry.count,
      limit: config.maxRequests,
      exceeded: entry.count > config.maxRequests,
      resetsAt: entry.windowStart + config.windowMs,
    };
  }

  function reset(url: string): void {
    entries.delete(url);
  }

  function all(): QuotaResult[] {
    const now = Date.now();
    return Array.from(entries.values()).map((e) => ({
      url: e.url,
      count: e.count,
      limit: config.maxRequests,
      exceeded: e.count > config.maxRequests,
      resetsAt: e.windowStart + config.windowMs,
    }));
  }

  return { record, check, reset, all };
}
