import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { ConfigSchema, Config } from './schema';
import { ZodError } from 'zod';

const SUPPORTED_EXTENSIONS = ['.yaml', '.yml', '.json'];

export class ConfigLoadError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = 'ConfigLoadError';
  }
}

export function loadConfig(filePath: string): Config {
  const resolved = path.resolve(filePath);
  const ext = path.extname(resolved).toLowerCase();

  if (!SUPPORTED_EXTENSIONS.includes(ext)) {
    throw new ConfigLoadError(
      `Unsupported config file extension: ${ext}. Use .yaml, .yml, or .json`
    );
  }

  if (!fs.existsSync(resolved)) {
    throw new ConfigLoadError(`Config file not found: ${resolved}`);
  }

  let raw: unknown;
  try {
    const content = fs.readFileSync(resolved, 'utf-8');
    raw = ext === '.json' ? JSON.parse(content) : yaml.load(content);
  } catch (err) {
    throw new ConfigLoadError(`Failed to parse config file: ${resolved}`, err);
  }

  try {
    return ConfigSchema.parse(raw);
  } catch (err) {
    if (err instanceof ZodError) {
      const messages = err.errors.map(e => `  - ${e.path.join('.')}: ${e.message}`).join('\n');
      throw new ConfigLoadError(`Invalid config:\n${messages}`);
    }
    throw err;
  }
}
