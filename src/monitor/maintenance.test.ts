import {
  createMaintenanceStore,
  addMaintenanceWindow,
  removeMaintenanceWindow,
  isInMaintenance,
  purgeExpiredWindows,
  listMaintenanceWindows,
} from "./maintenance";

function utcDate(offsetMs: number): Date {
  return new Date(Date.now() + offsetMs);
}

describe("maintenance", () => {
  it("returns false when no windows", () => {
    const store = createMaintenanceStore();
    expect(isInMaintenance(store, "https://api.example.com/health")).toBe(false);
  });

  it("detects active maintenance window", () => {
    const store = createMaintenanceStore();
    addMaintenanceWindow(store, {
      id: "w1",
      route: "https://api.example.com/health",
      start: utcDate(-1000),
      end: utcDate(60_000),
      reason: "deploy",
    });
    expect(isInMaintenance(store, "https://api.example.com/health")).toBe(true);
  });

  it("ignores windows for different routes", () => {
    const store = createMaintenanceStore();
    addMaintenanceWindow(store, {
      id: "w2",
      route: "https://other.com/api",
      start: utcDate(-1000),
      end: utcDate(60_000),
    });
    expect(isInMaintenance(store, "https://api.example.com/health")).toBe(false);
  });

  it("removes window by id", () => {
    const store = createMaintenanceStore();
    addMaintenanceWindow(store, {
      id: "w3",
      route: "https://api.example.com/health",
      start: utcDate(-1000),
      end: utcDate(60_000),
    });
    expect(removeMaintenanceWindow(store, "w3")).toBe(true);
    expect(isInMaintenance(store, "https://api.example.com/health")).toBe(false);
  });

  it("returns false when removing unknown id", () => {
    const store = createMaintenanceStore();
    expect(removeMaintenanceWindow(store, "nope")).toBe(false);
  });

  it("purges expired windows", () => {
    const store = createMaintenanceStore();
    addMaintenanceWindow(store, {
      id: "w4",
      route: "https://api.example.com/health",
      start: utcDate(-5000),
      end: utcDate(-1000),
    });
    const purged = purgeExpiredWindows(store);
    expect(purged).toBe(1);
    expect(store.windows).toHaveLength(0);
  });

  it("lists windows filtered by route", () => {
    const store = createMaintenanceStore();
    addMaintenanceWindow(store, { id: "a", route: "r1", start: utcDate(0), end: utcDate(1000) });
    addMaintenanceWindow(store, { id: "b", route: "r2", start: utcDate(0), end: utcDate(1000) });
    expect(listMaintenanceWindows(store, "r1")).toHaveLength(1);
    expect(listMaintenanceWindows(store)).toHaveLength(2);
  });
});
