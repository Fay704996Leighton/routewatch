import { formatReport, ReportEntry } from './formatter';

function makeEntry(overrides: Partial<ReportEntry> = {}): ReportEntry {
  return {
    endpoint: 'https://api.example.com/health',
    timestamp: '2024-01-15T10:00:00.000Z',
    analysisResult: {
      averageDuration: 120.5,
      regressionDetected: false,
      baselineAverage: undefined,
      currentAverage: undefined,
    },
    schemaDriftResult: {
      hasDrift: false,
      addedKeys: [],
      removedKeys: [],
    },
    ...overrides,
  };
}

describe('formatReport', () => {
  it('returns valid JSON when format is json', () => {
    const entries = [makeEntry()];
    const output = formatReport(entries, 'json');
    expect(() => JSON.parse(output)).not.toThrow();
    const parsed = JSON.parse(output);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].endpoint).toBe('https://api.example.com/health');
  });

  it('includes endpoint and timestamp in text format', () => {
    const entry = makeEntry();
    const output = formatReport([entry], 'text');
    expect(output).toContain('https://api.example.com/health');
    expect(output).toContain('2024-01-15T10:00:00.000Z');
  });

  it('flags regression in text output', () => {
    const entry = makeEntry({
      analysisResult: {
        averageDuration: 350,
        regressionDetected: true,
        baselineAverage: 100,
        currentAverage: 350,
      },
    });
    const output = formatReport([entry], 'text');
    expect(output).toContain('YES');
    expect(output).toContain('100.00');
    expect(output).toContain('350.00');
  });

  it('flags schema drift in text output', () => {
    const entry = makeEntry({
      schemaDriftResult: { hasDrift: true, addedKeys: ['newField'], removedKeys: ['oldField'] },
    });
    const output = formatReport([entry], 'text');
    expect(output).toContain('newField');
    expect(output).toContain('oldField');
  });

  it('separates multiple entries with dashes in text format', () => {
    const entries = [makeEntry(), makeEntry({ endpoint: 'https://api.example.com/users' })];
    const output = formatReport(entries, 'text');
    expect(output).toContain('----');
  });
});
