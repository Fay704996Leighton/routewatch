import { analyzeResponseTimes, averageDuration } from './analyzer';
import { ResponseSample } from './types';

function makeSample(endpoint: string, durationMs: number): ResponseSample {
  return {
    endpoint,
    url: `https://api.example.com${endpoint}`,
    statusCode: 200,
    durationMs,
    timestamp: new Date().toISOString(),
    ok: true,
  };
}

describe('analyzeResponseTimes', () => {
  const baseline = [
    makeSample('/users', 100),
    makeSample('/posts', 150),
  ];

  it('detects regression when both thresholds exceeded', () => {
    const current = [
      makeSample('/users', 400),
      makeSample('/posts', 160),
    ];
    const results = analyzeResponseTimes(baseline, current, {
      thresholdMs: 200,
      thresholdPercent: 20,
    });
    const users = results.find((r) => r.endpoint === '/users')!;
    const posts = results.find((r) => r.endpoint === '/posts')!;
    expect(users.regressed).toBe(true);
    expect(posts.regressed).toBe(false);
  });

  it('does not regress if only ms threshold exceeded but not percent', () => {
    const current = [makeSample('/users', 310)];
    const results = analyzeResponseTimes(baseline, current, {
      thresholdMs: 200,
      thresholdPercent: 300,
    });
    expect(results[0].regressed).toBe(false);
  });

  it('skips endpoints not in baseline', () => {
    const current = [makeSample('/unknown', 999)];
    const results = analyzeResponseTimes(baseline, current);
    expect(results).toHaveLength(0);
  });

  it('calculates deltaPercent correctly', () => {
    const current = [makeSample('/users', 150)];
    const results = analyzeResponseTimes(baseline, current);
    expect(results[0].deltaPercent).toBeCloseTo(50);
  });
});

describe('averageDuration', () => {
  it('returns 0 for empty array', () => {
    expect(averageDuration([])).toBe(0);
  });

  it('returns correct average', () => {
    const samples = [makeSample('/a', 100), makeSample('/b', 200)];
    expect(averageDuration(samples)).toBe(150);
  });
});
