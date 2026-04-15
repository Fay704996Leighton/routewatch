import type { RunOptions } from './runner';

const USAGE = `
Usage: routewatch [options]

Options:
  --config <path>   Path to config file (default: routewatch.json)
  --output <path>   Write report to file
  --silent          Suppress stdout output
  --help            Show this help message
`.trim();

export function parseArgs(argv: string[]): RunOptions {
  if (argv.includes('--help') || argv.includes('-h')) {
    console.log(USAGE);
    process.exit(0);
  }

  const options: RunOptions = {
    configPath: 'routewatch.json',
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];

    if (arg === '--config' || arg === '-c') {
      const next = argv[i + 1];
      if (!next || next.startsWith('--')) {
        console.error('Error: --config requires a path argument');
        process.exit(2);
      }
      options.configPath = next;
      i++;
    } else if (arg === '--output' || arg === '-o') {
      const next = argv[i + 1];
      if (!next || next.startsWith('--')) {
        console.error('Error: --output requires a path argument');
        process.exit(2);
      }
      options.outputPath = next;
      i++;
    } else if (arg === '--silent' || arg === '-s') {
      options.silent = true;
    } else {
      console.error(`Error: unknown argument "${arg}"`);
      console.error(USAGE);
      process.exit(2);
    }
  }

  return options;
}
