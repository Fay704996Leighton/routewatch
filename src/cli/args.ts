/**
 * CLI argument parsing for routewatch.
 */

export interface CliArgs {
  config: string;
  output?: string;
  format: 'text' | 'json';
  tags: string[];
  excludeTags: string[];
  dryRun: boolean;
  verbose: boolean;
  help: boolean;
}

const DEFAULT_CONFIG = 'routewatch.config.json';

export function parseArgs(argv: string[]): CliArgs {
  const args = argv.slice(2);
  const result: CliArgs = {
    config: DEFAULT_CONFIG,
    format: 'text',
    tags: [],
    excludeTags: [],
    dryRun: false,
    verbose: false,
    help: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    switch (arg) {
      case '--config':
      case '-c':
        result.config = args[++i] ?? DEFAULT_CONFIG;
        break;
      case '--output':
      case '-o':
        result.output = args[++i];
        break;
      case '--format':
      case '-f': {
        const fmt = args[++i];
        if (fmt === 'json' || fmt === 'text') result.format = fmt;
        break;
      }
      case '--tag':
      case '-t':
        result.tags.push(...(args[++i]?.split(',') ?? []));
        break;
      case '--exclude-tag':
        result.excludeTags.push(...(args[++i]?.split(',') ?? []));
        break;
      case '--dry-run':
        result.dryRun = true;
        break;
      case '--verbose':
      case '-v':
        result.verbose = true;
        break;
      case '--help':
      case '-h':
        result.help = true;
        break;
    }
  }

  return result;
}
