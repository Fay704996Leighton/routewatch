import { createMuteStore } from "../monitor/mute";
import { join } from "path";

const DEFAULT_STORE = join(process.cwd(), ".routewatch", "mute.json");

export type MuteAction = "mute" | "unmute" | "list";

export interface MuteCommandOptions {
  action: MuteAction;
  url?: string;
  reason?: string;
  ttl?: number; // seconds
  storePath?: string;
}

export function runMuteCommand(opts: MuteCommandOptions): void {
  const storePath = opts.storePath ?? DEFAULT_STORE;
  const store = createMuteStore(storePath);

  switch (opts.action) {
    case "mute": {
      if (!opts.url) throw new Error("--url is required for mute");
      const ttlMs = opts.ttl != null ? opts.ttl * 1000 : undefined;
      store.muteRoute(opts.url, opts.reason ?? "", ttlMs);
      const expiry = ttlMs != null ? ` (expires in ${opts.ttl}s)` : " (permanent)";
      console.log(`Muted ${opts.url}${expiry}`);
      break;
    }
    case "unmute": {
      if (!opts.url) throw new Error("--url is required for unmute");
      store.unmuteRoute(opts.url);
      console.log(`Unmuted ${opts.url}`);
      break;
    }
    case "list": {
      store.purgeExpired();
      const rules = store.list();
      if (rules.length === 0) {
        console.log("No muted routes.");
      } else {
        console.log(`Muted routes (${rules.length}):`);
        for (const r of rules) {
          const exp = r.expiresAt
            ? new Date(r.expiresAt).toISOString()
            : "never";
          console.log(`  ${r.url} — ${r.reason} (expires: ${exp})`);
        }
      }
      break;
    }
    default:
      throw new Error(`Unknown action: ${opts.action}`);
  }
}
