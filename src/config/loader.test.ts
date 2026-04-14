import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { loadConfig } from './loader';
import { ConfigLoadError } from './loader';

const tmpDir = os.tmpdir();

function writeTmp(name: string, content: string): string {
  const filePath = path.join(tmpDir, name);
  fs.writeFileSync(filePath, content, 'utf-8');
  return filePath;
}

describe('loadConfig', () => {
  it('loads a valid YAML config', () => {
    const file = writeTmp('valid.yaml', `
version: "1"
endpoints:
  - name: healthcheck
    url: https://example.com/health
    method: GET
`);
    const config = loadConfig(file);
    expect(config.endpoints).toHaveLength(1);
    expect(config.endpoints[0].name).toBe('healthcheck');
    expect(config.endpoints[0].thresholds.responseTimeMs).toBe(2000);
  });

  it('loads a valid JSON config', () => {
    const file = writeTmp('valid.json', JSON.stringify({
      version: '1',
      endpoints: [{ name: 'api', url: 'https://api.example.com' }],
    }));
    const config = loadConfig(file);
    expect(config.endpoints[0].name).toBe('api');
  });

  it('throws ConfigLoadError for missing file', () => {
    expect(() => loadConfig('/nonexistent/path/config.yaml'))
      .toThrow(ConfigLoadError);
  });

  it('throws ConfigLoadError for unsupported extension', () => {
    const file = writeTmp('config.toml', '');
    expect(() => loadConfig(file)).toThrow(ConfigLoadError);
  });

  it('throws ConfigLoadError for invalid schema', () => {
    const file = writeTmp('invalid.yaml', `
version: "1"
endpoints:
  - name: ""
    url: not-a-url
`);
    expect(() => loadConfig(file)).toThrow(ConfigLoadError);
  });

  it('throws ConfigLoadError for empty endpoints array', () => {
    const file = writeTmp('empty.yaml', `version: "1"\nendpoints: []`);
    expect(() => loadConfig(file)).toThrow(ConfigLoadError);
  });
});
