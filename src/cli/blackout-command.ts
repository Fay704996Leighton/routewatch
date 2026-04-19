import { createBlackoutStore, addBlackoutWindow, removeBlackoutWindow, listBlackoutWindows } from "../monitor/blackout";
import * as fs from "fs";

const DEFAULT_PATH = ".routewatch-blackout.json";

function load(path: string) {
  if (fs.existsSync(path)) {
    return JSON.parse(fs.readFileSync(path, "utf8"));
  }
  return createBlackoutStore();
}

function save(path: string, store: ReturnType<typeof createBlackoutStore>) {
  fs.writeFileSync(path, JSON.stringify(store, null, 2));
}

export function runBlackoutCommand(argv: string[]): void {
  const [sub, ...rest] = argv;
  const storePath = DEFAULT_PATH;
  const store = load(storePath);

  if (sub === "add") {
    const id = rest[0];
    const startHour = parseInt(rest[1], 10);
    const endHour = parseInt(rest[2], 10);
    const days = rest[3] ? rest[3].split(",").map(Number) : undefined;
    if (!id || isNaN(startHour) || isNaN(endHour)) {
      console.error("Usage: blackout add <id> <startHour> <endHour> [days]");
      process.exit(1);
    }
    addBlackoutWindow(store, { id, startHour, endHour, days });
    save(storePath, store);
    console.log(`Blackout window '${id}' added (${startHour}:00-${endHour}:00 UTC).`);
  } else if (sub === "remove") {
    const id = rest[0];
    if (!id) { console.error("Usage: blackout remove <id>"); process.exit(1); }
    const ok = removeBlackoutWindow(store, id);
    if (!ok) { console.error(`No window with id '${id}'.`); process.exit(1); }
    save(storePath, store);
    console.log(`Blackout window '${id}' removed.`);
  } else if (sub === "list") {
    const windows = listBlackoutWindows(store);
    if (!windows.length) { console.log("No blackout windows defined."); return; }
    for (const w of windows) {
      const days = w.days ? `days:${w.days.join(",")}` : "all days";
      console.log(`  [${w.id}] ${w.startHour}:00-${w.endHour}:00 UTC (${days})${w.label ? " — " + w.label : ""}`);
    }
  } else {
    console.error("Usage: blackout <add|remove|list>");
    process.exit(1);
  }
}
