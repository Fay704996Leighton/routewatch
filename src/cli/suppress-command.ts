import { createSuppressStore, addRule, isSuppressed, suppressStats } from "../monitor/suppress";

// Shared in-process store (real usage would persist to disk)
const globalStore = createSuppressStore();

export interface SuppressCommandArgs {
  action: "add" | "check" | "stats";
  url?: string;
  tag?: string;
  durationMs?: number;
  reason?: string;
  tags?: string[];
}

export function runSuppressCommand(args: SuppressCommandArgs): string {
  const now = Date.now();

  if (args.action === "add") {
    if (!args.url && !args.tag) {
      return "Error: must provide --url or --tag";
    }
    const until = now + (args.durationMs ?? 3_600_000);
    addRule(globalStore, {
      url: args.url,
      tag: args.tag,
      until,
      reason: args.reason,
    });
    const exp = new Date(until).toISOString();
    const target = args.url ?? `tag:${args.tag}`;
    return `Suppression added for ${target} until ${exp}${args.reason ? ` (${args.reason})` : ""}`;
  }

  if (args.action === "check") {
    if (!args.url) return "Error: --url required for check";
    const suppressed = isSuppressed(globalStore, args.url, args.tags ?? [], now);
    return suppressed
      ? `${args.url} is currently suppressed`
      : `${args.url} is NOT suppressed`;
  }

  if (args.action === "stats") {
    const s = suppressStats(globalStore, now);
    return `Active suppression rules: ${s.active}`;
  }

  return "Unknown action";
}
