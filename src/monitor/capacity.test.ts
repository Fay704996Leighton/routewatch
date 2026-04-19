import { describe, it, expect } from 'vitest';
import {
  buildCapacityEntry,
  buildCapacityReport,
  formatCapacityReport,
  capacityToJson,
  percentile,
} from './capacity';

function makeDurations(base: number, count = 10): number[] {
  return Array.from({ length: count }, (_, i) => base + i * 10);
}

describe('percentile', () => {
  it('returns correct p95', () => {
    const sorted = Array.from({ length: 100 }, (_, i) => i + 1);
    expect(percentile(sorted, 95)).toBe(95);
  });

  it('handles empty array', () => {
    expect(percentile([], 95)).toBe(0);
  });
});

describe('buildCapacityEntry', () => {
  it('computes ok status for low utilization', () => {
    const entry = buildCapacityEntry('https://api.example.com/health', makeDurations(100), 5);
    expect(entry.status).toBe('ok');
    expect(entry.utilizationPct).toBeLessThan(70);
  });

  it('computes warning status', () => {
    const entry = buildCapacityEntry('https://api.example.com/health', makeDurations(100), 210, 2000);
    expect(['warning', 'critical']).toContain(entry.status);
  });

  it('computes critical at high utilization', () => {
    const entry = buildCapacityEntry('https://api.example.com/users', makeDurations(100), 299, 2000);
    expect(entry.status).toBe('critical');
    expect(entry.utilizationPct).toBeGreaterThanOrEqual(90);
  });

  it('includes url and p95', () => {
    const entry = buildCapacityEntry('https://x.com/a', [100, 200, 300], 1);
    expect(entry.url).toBe('https://x.com/a');
    expect(entry.p95Duration).toBeGreaterThan(0);
  });
});

describe('buildCapacityReport', () => {
  it('wraps entries with timestamp', () => {
    const entry = buildCapacityEntry('https://api.example.com', [100], 1);
    const report = buildCapacityReport([entry]);
    expect(report.entries).toHaveLength(1);
    expect(report.generatedAt).toBeTruthy();
  });
});

describe('formatCapacityReport', () => {
  it('includes url and status in output', () => {
    const entry = buildCapacityEntry('https://api.example.com/data', makeDurations(50), 5);
    const report = buildCapacityReport([entry]);
    const text = formatCapacityReport(report);
    expect(text).toContain('https://api.example.com/data');
    expect(text).toContain('OK');
  });
});

describe('capacityToJson', () => {
  it('returns valid JSON', () => {
    const report = buildCapacityReport([]);
    const json = capacityToJson(report);
    expect(() => JSON.parse(json)).not.toThrow();
  });
});
