import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { writeReport } from './writer';
import { ReportEntry } from './formatter';

function makeEntry(): ReportEntry {
  return {
    endpoint: 'https://api.example.com/ping',
    timestamp: new Date().toISOString(),
    analysisResult: {
      averageDuration: 80,
      regressionDetected: false,
      baselineAverage: undefined,
      currentAverage: undefined,
    },
    schemaDriftResult: { hasDrift: false, addedKeys: [], removedKeys: [] },
  };
}

describe('writeReport', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'routewatch-test-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('creates output directory if it does not exist', () => {
    const outputDir = path.join(tmpDir, 'nested', 'reports');
    writeReport([makeEntry()], { outputDir, format: 'text' });
    expect(fs.existsSync(outputDir)).toBe(true);
  });

  it('writes a .txt file for text format', () => {
    const filepath = writeReport([makeEntry()], { outputDir: tmpDir, format: 'text' });
    expect(filepath.endsWith('.txt')).toBe(true);
    expect(fs.existsSync(filepath)).toBe(true);
  });

  it('writes a .json file for json format', () => {
    const filepath = writeReport([makeEntry()], { outputDir: tmpDir, format: 'json' });
    expect(filepath.endsWith('.json')).toBe(true);
    const raw = fs.readFileSync(filepath, 'utf-8');
    expect(() => JSON.parse(raw)).not.toThrow();
  });

  it('written text file contains endpoint url', () => {
    const filepath = writeReport([makeEntry()], { outputDir: tmpDir, format: 'text' });
    const content = fs.readFileSync(filepath, 'utf-8');
    expect(content).toContain('https://api.example.com/ping');
  });
});
