import { readFileSync, writeFileSync, existsSync } from "fs";
import {
  createMaintenanceStore,
  addMaintenanceWindow,
  removeMaintenanceWindow,
  listMaintenanceWindows,
  purgeExpiredWindows,
  MaintenanceStore,
} from "../monitor/maintenance";

const DEFAULT_PATH = ".routewatch-maintenance.json";

function load(path: string): MaintenanceStore {
  if (!existsSync(path)) return createMaintenanceStore();
  const raw = JSON.parse(readFileSync(path, "utf-8"));
  raw.windows = raw.windows.map((w: any) => ({
    ...w,
    start: new Date(w.start),
    end: new Date(w.end),
  }));
  return raw;
}

function save(store: MaintenanceStore, path: string): void {
  writeFileSync(path, JSON.stringify(store, null, 2));
}

export function runMaintenanceCommand(argv: string[]): void {
  const [sub, ...rest] = argv;
  const storePath = DEFAULT_PATH;
  const store = load(storePath);
  purgeExpiredWindows(store);

  if (sub === "add") {
    const [id, route, start, end, ...reasonParts] = rest;
    if (!id || !route || !start || !end) {
      console.error("Usage: maintenance add <id> <route> <start-iso> <end-iso> [reason]");
      process.exit(1);
    }
    addMaintenanceWindow(store, {
      id,
      route,
      start: new Date(start),
      end: new Date(end),
      reason: reasonParts.join(" ") || undefined,
    });
    save(store, storePath);
    console.log(`Maintenance window '${id}' added for ${route}`);
  } else if (sub === "remove") {
    const [id] = rest;
    if (!id) { console.error("Usage: maintenance remove <id>"); process.exit(1); }
    const ok = removeMaintenanceWindow(store, id);
    save(store, storePath);
    console.log(ok ? `Removed window '${id}'` : `Window '${id}' not found`);
  } else if (sub === "list") {
    const [route] = rest;
    const windows = listMaintenanceWindows(store, route);
    if (windows.length === 0) { console.log("No active maintenance windows."); return; }
    for (const w of windows) {
      console.log(`[${w.id}] ${w.route} | ${w.start.toISOString()} → ${w.end.toISOString()}${w.reason ? ` (${w.reason})` : ""}`);
    }
  } else {
    console.error("Usage: maintenance <add|remove|list> ...");
    process.exit(1);
  }
}
