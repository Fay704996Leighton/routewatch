import { PollResult } from './types';

export interface PollSummary {
  total: number;
  success: number;
  failed: number;
  errors: number;
  avgDuration: number;
  urls: string[];
}

function isSuccess(result: PollResult): boolean {
  return !result.error && result.status >= 200 && result.status < 300;
}

function isError(result: PollResult): boolean {
  return !!result.error;
}

function isFailed(result: PollResult): boolean {
  return !result.error && (result.status < 200 || result.status >= 300);
}

export function summarizePollResults(results: PollResult[]): PollSummary {
  if (results.length === 0) {
    return {
      total: 0,
      success: 0,
      failed: 0,
      errors: 0,
      avgDuration: 0,
      urls: [],
    };
  }

  const success = results.filter(isSuccess).length;
  const failed = results.filter(isFailed).length;
  const errors = results.filter(isError).length;

  const validDurations = results
    .filter((r) => !r.error)
    .map((r) => r.duration);

  const avgDuration =
    validDurations.length > 0
      ? validDurations.reduce((sum, d) => sum + d, 0) / validDurations.length
      : 0;

  const urls = Array.from(new Set(results.map((r) => r.url)));

  return {
    total: results.length,
    success,
    failed,
    errors,
    avgDuration,
    urls,
  };
}
