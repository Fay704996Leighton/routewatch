import { deduplicateAlerts, purgeExpiredEntries, makeAlertKey, DedupStore } from './dedup';
import { Alert } from './alert';

function makeAlert(endpoint: string, type: Alert['type'] = 'regression', severity: Alert['severity'] = 'warning'): Alert {
  return { endpoint, type, severity, message: 'test alert', timestamp: new Date().toISOString() };
}

describe('makeAlertKey', () => {
  it('produces a consistent key', () => {
    const a = makeAlert('https://api.example.com/health');
    expect(makeAlertKey(a)).toBe('https://api.example.com/health::regression::warning');
  });
});

describe('deduplicateAlerts', () => {
  const NOW = 1_000_000;
  const COOLDOWN = 60_000;

  it('passes through alerts not in store', () => {
    const alerts = [makeAlert('/a'), makeAlert('/b')];
    const { fresh, store } = deduplicateAlerts(alerts, {}, COOLDOWN, NOW);
    expect(fresh).toHaveLength(2);
    expect(store[makeAlertKey(alerts[0])]).toBe(NOW);
  });

  it('suppresses alerts within cooldown', () => {
    const alert = makeAlert('/a');
    const store: DedupStore = { [makeAlertKey(alert)]: NOW - 10_000 };
    const { fresh } = deduplicateAlerts([alert], store, COOLDOWN, NOW);
    expect(fresh).toHaveLength(0);
  });

  it('allows alerts after cooldown expires', () => {
    const alert = makeAlert('/a');
    const store: DedupStore = { [makeAlertKey(alert)]: NOW - COOLDOWN - 1 };
    const { fresh } = deduplicateAlerts([alert], store, COOLDOWN, NOW);
    expect(fresh).toHaveLength(1);
  });

  it('does not mutate original store', () => {
    const alert = makeAlert('/a');
    const original: DedupStore = {};
    deduplicateAlerts([alert], original, COOLDOWN, NOW);
    expect(original).toEqual({});
  });
});

describe('purgeExpiredEntries', () => {
  const NOW = 1_000_000;
  const COOLDOWN = 60_000;

  it('removes entries older than cooldown', () => {
    const store: DedupStore = {
      old: NOW - COOLDOWN - 1,
      fresh: NOW - 1000,
    };
    const result = purgeExpiredEntries(store, COOLDOWN, NOW);
    expect(result.old).toBeUndefined();
    expect(result.fresh).toBe(NOW - 1000);
  });

  it('returns empty object when all entries expired', () => {
    const store: DedupStore = { a: NOW - 999_999 };
    expect(purgeExpiredEntries(store, COOLDOWN, NOW)).toEqual({});
  });
});
