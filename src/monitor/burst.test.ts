import { describe, it, expect } from 'vitest';
import {
  detectBurst,
  buildBurstReport,
  burstToJson,
  formatBurstReport,
  BurstInput,
} from './burst';

function makeInput(url: string, statusCode: number): BurstInput {
  return { url, durationMs: 100, statusCode };
}

describe('detectBurst', () => {
  it('marks url as burst when failure rate meets threshold', () => {
    const inputs = [
      makeInput('https://api.example.com/a', 500),
      makeInput('https://api.example.com/a', 500),
      makeInput('https://api.example.com/a', 200),
      makeInput('https://api.example.com/a', 200),
    ];
    const entries = detectBurst(inputs, 60_000, 0.5);
    expect(entries).toHaveLength(1);
    expect(entries[0].isBurst).toBe(true);
    expect(entries[0].failureRate).toBe(0.5);
  });

  it('does not mark url as burst below threshold', () => {
    const inputs = [
      makeInput('https://api.example.com/b', 500),
      makeInput('https://api.example.com/b', 200),
      makeInput('https://api.example.com/b', 200),
      makeInput('https://api.example.com/b', 200),
    ];
    const entries = detectBurst(inputs, 60_000, 0.5);
    expect(entries[0].isBurst).toBe(false);
    expect(entries[0].failureRate).toBeCloseTo(0.25);
  });

  it('groups by url independently', () => {
    const inputs = [
      makeInput('https://api.example.com/a', 500),
      makeInput('https://api.example.com/a', 500),
      makeInput('https://api.example.com/b', 200),
      makeInput('https://api.example.com/b', 200),
    ];
    const entries = detectBurst(inputs, 60_000, 0.5);
    const a = entries.find(e => e.url.endsWith('/a'))!;
    const b = entries.find(e => e.url.endsWith('/b'))!;
    expect(a.isBurst).toBe(true);
    expect(b.isBurst).toBe(false);
  });

  it('treats status 0 as failure', () => {
    const inputs = [makeInput('https://api.example.com/c', 0)];
    const entries = detectBurst(inputs, 60_000, 0.5);
    expect(entries[0].failedRequests).toBe(1);
    expect(entries[0].isBurst).toBe(true);
  });
});

describe('buildBurstReport', () => {
  it('returns a report with metadata', () => {
    const inputs = [makeInput('https://api.example.com/x', 200)];
    const report = buildBurstReport(inputs, 30_000, 0.4);
    expect(report.windowMs).toBe(30_000);
    expect(report.threshold).toBe(0.4);
    expect(report.entries).toHaveLength(1);
    expect(report.generatedAt).toBeTruthy();
  });
});

describe('burstToJson', () => {
  it('serialises to valid JSON', () => {
    const report = buildBurstReport([makeInput('https://api.example.com/y', 500)]);
    const json = burstToJson(report);
    expect(() => JSON.parse(json)).not.toThrow();
    expect(JSON.parse(json).entries).toHaveLength(1);
  });
});

describe('formatBurstReport', () => {
  it('includes BURST label for bursting urls', () => {
    const inputs = [
      makeInput('https://api.example.com/z', 500),
      makeInput('https://api.example.com/z', 500),
    ];
    const report = buildBurstReport(inputs, 60_000, 0.5);
    const text = formatBurstReport(report);
    expect(text).toContain('BURST');
    expect(text).toContain('https://api.example.com/z');
  });

  it('includes ok label for healthy urls', () => {
    const inputs = [makeInput('https://api.example.com/ok', 200)];
    const report = buildBurstReport(inputs, 60_000, 0.5);
    const text = formatBurstReport(report);
    expect(text).toContain('ok');
  });
});
