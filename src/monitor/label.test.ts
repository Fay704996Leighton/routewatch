import { describe, it, expect } from 'vitest';
import {
  matchesLabels,
  filterByLabels,
  collectLabelKeys,
  parseLabelSelector,
} from './label';

interface Route {
  url: string;
  labels?: Record<string, string>;
}

const routes: Route[] = [
  { url: '/a', labels: { env: 'prod', team: 'alpha' } },
  { url: '/b', labels: { env: 'staging', team: 'alpha' } },
  { url: '/c', labels: { env: 'prod', team: 'beta' } },
  { url: '/d' },
];

describe('matchesLabels', () => {
  it('matches when all selector keys match', () => {
    expect(matchesLabels(routes[0], { env: 'prod' })).toBe(true);
  });

  it('does not match on wrong value', () => {
    expect(matchesLabels(routes[0], { env: 'staging' })).toBe(false);
  });

  it('matches empty selector for item with labels', () => {
    expect(matchesLabels(routes[0], {})).toBe(true);
  });

  it('matches empty selector for item without labels', () => {
    expect(matchesLabels(routes[3], {})).toBe(true);
  });

  it('does not match non-empty selector for item without labels', () => {
    expect(matchesLabels(routes[3], { env: 'prod' })).toBe(false);
  });
});

describe('filterByLabels', () => {
  it('filters by single label', () => {
    const result = filterByLabels(routes, { env: 'prod' });
    expect(result.map((r) => r.url)).toEqual(['/a', '/c']);
  });

  it('filters by multiple labels', () => {
    const result = filterByLabels(routes, { env: 'prod', team: 'alpha' });
    expect(result.map((r) => r.url)).toEqual(['/a']);
  });

  it('returns all for empty selector', () => {
    expect(filterByLabels(routes, {}).length).toBe(4);
  });
});

describe('collectLabelKeys', () => {
  it('collects all unique keys sorted', () => {
    expect(collectLabelKeys(routes)).toEqual(['env', 'team']);
  });

  it('returns empty for items without labels', () => {
    expect(collectLabelKeys([{ url: '/x' }])).toEqual([]);
  });
});

describe('parseLabelSelector', () => {
  it('parses key=value pairs', () => {
    expect(parseLabelSelector('env=prod,team=alpha')).toEqual({ env: 'prod', team: 'alpha' });
  });

  it('returns empty for blank string', () => {
    expect(parseLabelSelector('')).toEqual({});
  });

  it('skips malformed parts', () => {
    expect(parseLabelSelector('env=prod,badpart,team=beta')).toEqual({ env: 'prod', team: 'beta' });
  });
});
