export interface MaintenanceWindow {
  id: string;
  route: string;
  start: Date;
  end: Date;
  reason?: string;
}

export interface MaintenanceStore {
  windows: MaintenanceWindow[];
}

export function createMaintenanceStore(): MaintenanceStore {
  return { windows: [] };
}

export function addMaintenanceWindow(
  store: MaintenanceStore,
  win: MaintenanceWindow
): void {
  store.windows.push(win);
}

export function removeMaintenanceWindow(
  store: MaintenanceStore,
  id: string
): boolean {
  const before = store.windows.length;
  store.windows = store.windows.filter((w) => w.id !== id);
  return store.windows.length < before;
}

export function isInMaintenance(
  store: MaintenanceStore,
  route: string,
  at: Date = new Date()
): boolean {
  return store.windows.some(
    (w) =>
      w.route === route &&
      at >= w.start &&
      at <= w.end
  );
}

export function purgeExpiredWindows(
  store: MaintenanceStore,
  now: Date = new Date()
): number {
  const before = store.windows.length;
  store.windows = store.windows.filter((w) => w.end > now);
  return before - store.windows.length;
}

export function listMaintenanceWindows(
  store: MaintenanceStore,
  route?: string
): MaintenanceWindow[] {
  if (route) return store.windows.filter((w) => w.route === route);
  return [...store.windows];
}
