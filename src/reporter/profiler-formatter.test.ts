import { formatProfileEntry, formatProfileReport, profileReportToJson } from './profiler-formatter';
import { buildProfileEntry, buildProfileReport } from '../monitor/profiler';

function makeEntry(overrides: Partial<ReturnType<typeof buildProfileEntry>> = {}) {
  return {
    url: 'https://api.example.com/items',
    method: 'GET',
    p50: 120,
    p95: 300,
    p99: 450,
    min: 80,
    max: 500,
    sampleCount: 10,
    ...overrides,
  };
}

describe('formatProfileEntry', () => {
  it('includes url and method', () => {
    const out = formatProfileEntry(makeEntry());
    expect(out).toContain('GET https://api.example.com/items');
  });

  it('includes p95 and p99', () => {
    const out = formatProfileEntry(makeEntry());
    expect(out).toContain('P95:');
    expect(out).toContain('P99:');
  });

  it('includes sample count', () => {
    const out = formatProfileEntry(makeEntry({ sampleCount: 42 }));
    expect(out).toContain('42');
  });
});

describe('formatProfileReport', () => {
  it('shows no data message for empty report', () => {
    const report = buildProfileReport([]);
    const out = formatProfileReport(report);
    expect(out).toContain('No data');
  });

  it('includes header with timestamp', () => {
    const entry = buildProfileEntry('https://api.example.com/', 'GET', [100, 200, 300]);
    const report = buildProfileReport([entry]);
    const out = formatProfileReport(report);
    expect(out).toContain('RouteWatch Profile Report');
  });

  it('includes entry details', () => {
    const entry = buildProfileEntry('https://api.example.com/search', 'GET', [100, 200]);
    const report = buildProfileReport([entry]);
    const out = formatProfileReport(report);
    expect(out).toContain('/search');
  });
});

describe('profileReportToJson', () => {
  it('returns parseable JSON', () => {
    const report = buildProfileReport([makeEntry()]);
    expect(() => JSON.parse(profileReportToJson(report))).not.toThrow();
  });
});
