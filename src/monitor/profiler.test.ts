import { buildProfileEntry, buildProfileReport, percentile, profileToJson } from './profiler';

describe('percentile', () => {
  it('returns 0 for empty array', () => {
    expect(percentile([], 50)).toBe(0);
  });

  it('returns correct p50', () => {
    expect(percentile([100, 200, 300, 400, 500], 50)).toBe(300);
  });

  it('returns correct p95', () => {
    const sorted = Array.from({ length: 100 }, (_, i) => i + 1);
    expect(percentile(sorted, 95)).toBe(95);
  });

  it('returns the only element for single-item array', () => {
    expect(percentile([42], 99)).toBe(42);
  });
});

describe('buildProfileEntry', () => {
  const durations = [120, 300, 450, 80, 200, 500, 95, 410, 310, 150];

  it('computes min and max', () => {
    const entry = buildProfileEntry('https://api.example.com/users', 'GET', durations);
    expect(entry.min).toBe(80);
    expect(entry.max).toBe(500);
  });

  it('sets sampleCount', () => {
    const entry = buildProfileEntry('https://api.example.com/users', 'GET', durations);
    expect(entry.sampleCount).toBe(durations.length);
  });

  it('sets url and method', () => {
    const entry = buildProfileEntry('https://api.example.com/users', 'POST', durations);
    expect(entry.url).toBe('https://api.example.com/users');
    expect(entry.method).toBe('POST');
  });

  it('handles single sample', () => {
    const entry = buildProfileEntry('https://api.example.com/', 'GET', [250]);
    expect(entry.p50).toBe(250);
    expect(entry.p99).toBe(250);
  });

  it('p50 is less than or equal to p99', () => {
    const entry = buildProfileEntry('https://api.example.com/users', 'GET', durations);
    expect(entry.p50).toBeLessThanOrEqual(entry.p99);
  });
});

describe('buildProfileReport', () => {
  it('includes generatedAt', () => {
    const report = buildProfileReport([]);
    expect(report.generatedAt).toBeTruthy();
  });

  it('includes entries', () => {
    const entry = buildProfileEntry('https://api.example.com/', 'GET', [100, 200]);
    const report = buildProfileReport([entry]);
    expect(report.entries).toHaveLength(1);
  });

  it('generatedAt is a valid ISO date string', () => {
    const report = buildProfileReport([]);
    expect(new Date(report.generatedAt).toISOString()).toBe(report.generatedAt);
  });
});

describe('profileToJson', () => {
  it('returns valid JSON', () => {
    const report = buildProfileReport([]);
    expect(() => JSON.parse(profileToJson(report))).not.toThrow();
  });
});
