import { summarizePollResults } from './poll-summary';
import { PollResult } from './types';

function makePollResult(overrides: Partial<PollResult> = {}): PollResult {
  return {
    url: 'https://api.example.com/health',
    status: 200,
    duration: 120,
    timestamp: new Date('2024-01-01T00:00:00Z'),
    body: { ok: true },
    error: undefined,
    ...overrides,
  };
}

describe('summarizePollResults', () => {
  it('returns correct counts for all successful results', () => {
    const results = [
      makePollResult({ status: 200 }),
      makePollResult({ status: 201 }),
      makePollResult({ status: 200 }),
    ];
    const summary = summarizePollResults(results);
    expect(summary.total).toBe(3);
    expect(summary.success).toBe(3);
    expect(summary.failed).toBe(0);
    expect(summary.errors).toBe(0);
  });

  it('counts non-2xx responses as failed', () => {
    const results = [
      makePollResult({ status: 200 }),
      makePollResult({ status: 500 }),
      makePollResult({ status: 404 }),
    ];
    const summary = summarizePollResults(results);
    expect(summary.total).toBe(3);
    expect(summary.success).toBe(1);
    expect(summary.failed).toBe(2);
    expect(summary.errors).toBe(0);
  });

  it('counts results with error field as errors', () => {
    const results = [
      makePollResult({ status: 200 }),
      makePollResult({ status: 0, error: 'ECONNREFUSED' }),
      makePollResult({ status: 0, error: 'Timeout' }),
    ];
    const summary = summarizePollResults(results);
    expect(summary.total).toBe(3);
    expect(summary.success).toBe(1);
    expect(summary.failed).toBe(0);
    expect(summary.errors).toBe(2);
  });

  it('computes average duration excluding errored results', () => {
    const results = [
      makePollResult({ duration: 100 }),
      makePollResult({ duration: 200 }),
      makePollResult({ duration: 0, error: 'Timeout' }),
    ];
    const summary = summarizePollResults(results);
    expect(summary.avgDuration).toBeCloseTo(150, 1);
  });

  it('returns avgDuration of 0 when all results are errors', () => {
    const results = [
      makePollResult({ status: 0, duration: 0, error: 'ECONNREFUSED' }),
    ];
    const summary = summarizePollResults(results);
    expect(summary.avgDuration).toBe(0);
  });

  it('handles empty results array', () => {
    const summary = summarizePollResults([]);
    expect(summary.total).toBe(0);
    expect(summary.success).toBe(0);
    expect(summary.failed).toBe(0);
    expect(summary.errors).toBe(0);
    expect(summary.avgDuration).toBe(0);
  });
});
