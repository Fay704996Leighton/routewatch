#!/usr/bin/env node
import { parseArgs } from './args';
import { run } from './runner';

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));

  try {
    const entries = await run(options);
    const hasAlerts = entries.some(hasAnyAlerts);

    process.exit(hasAlerts ? 1 : 0);
  } catch (err) {
    console.error('routewatch error:', err instanceof Error ? err.message : err);
    process.exit(2);
  }
}

/**
 * Returns true if a run entry contains any regressions or schema drift issues.
 */
function hasAnyAlerts(e: Awaited<ReturnType<typeof run>>[number]): boolean {
  return (
    e.analysis.regressions.length > 0 ||
    e.schemaDrift.driftedKeys.length > 0 ||
    e.schemaDrift.missingKeys.length > 0
  );
}

main();
