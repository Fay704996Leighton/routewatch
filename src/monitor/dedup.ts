/**
 * Alert deduplication: suppress alerts that were already fired
 * within a configurable cooldown window.
 */

import { Alert } from './alert';

export interface DedupStore {
  [key: string]: number; // key -> last fired timestamp (ms)
}

export function makeAlertKey(alert: Alert): string {
  return `${alert.endpoint}::${alert.type}::${alert.severity}`;
}

export function deduplicateAlerts(
  alerts: Alert[],
  store: DedupStore,
  cooldownMs: number,
  now: number = Date.now()
): { fresh: Alert[]; store: DedupStore } {
  const updated: DedupStore = { ...store };
  const fresh: Alert[] = [];

  for (const alert of alerts) {
    const key = makeAlertKey(alert);
    const last = updated[key];

    if (last === undefined || now - last >= cooldownMs) {
      fresh.push(alert);
      updated[key] = now;
    }
  }

  return { fresh, store: updated };
}

export function purgeExpiredEntries(
  store: DedupStore,
  cooldownMs: number,
  now: number = Date.now()
): DedupStore {
  const result: DedupStore = {};
  for (const [key, ts] of Object.entries(store)) {
    if (now - ts < cooldownMs) {
      result[key] = ts;
    }
  }
  return result;
}
