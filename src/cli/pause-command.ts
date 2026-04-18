import { createPauseStore, pauseRoute, resumeRoute, listPaused, PauseStore } from "../monitor/pause";

let _store: PauseStore | null = null;

function getStore(): PauseStore {
  if (!_store) _store = createPauseStore();
  return _store;
}

export function runPauseCommand(argv: string[]): void {
  const [subcommand, url, ...rest] = argv;
  const store = getStore();

  if (subcommand === "add") {
    if (!url) {
      console.error("Usage: pause add <url> [reason] [durationMs]");
      process.exit(1);
    }
    const reason = rest[0] ?? "manual";
    const durationMs = rest[1] ? parseInt(rest[1], 10) : undefined;
    const entry = pauseRoute(store, url, reason, durationMs);
    console.log(`Paused: ${entry.url} — ${entry.reason}`);
    if (entry.resumeAt) {
      console.log(`  Resumes at: ${new Date(entry.resumeAt).toISOString()}`);
    }
    return;
  }

  if (subcommand === "remove") {
    if (!url) {
      console.error("Usage: pause remove <url>");
      process.exit(1);
    }
    const removed = resumeRoute(store, url);
    console.log(removed ? `Resumed: ${url}` : `Not found: ${url}`);
    return;
  }

  if (subcommand === "list") {
    const entries = listPaused(store);
    if (entries.length === 0) {
      console.log("No paused routes.");
      return;
    }
    for (const e of entries) {
      const resume = e.resumeAt ? new Date(e.resumeAt).toISOString() : "indefinite";
      console.log(`  ${e.url}  reason=${e.reason}  resumeAt=${resume}`);
    }
    return;
  }

  console.error("Unknown pause subcommand. Use: add | remove | list");
  process.exit(1);
}
