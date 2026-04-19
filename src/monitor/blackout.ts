// Blackout windows: suppress monitoring during scheduled maintenance periods

export interface BlackoutWindow {
  id: string;
  label?: string;
  startHour: number; // 0-23 UTC
  endHour: number;   // 0-23 UTC
  days?: number[];   // 0=Sun..6=Sat, undefined=all days
}

export interface BlackoutStore {
  windows: BlackoutWindow[];
}

export function createBlackoutStore(): BlackoutStore {
  return { windows: [] };
}

export function addBlackoutWindow(store: BlackoutStore, win: BlackoutWindow): void {
  store.windows.push(win);
}

export function removeBlackoutWindow(store: BlackoutStore, id: string): boolean {
  const before = store.windows.length;
  store.windows = store.windows.filter(w => w.id !== id);
  return store.windows.length < before;
}

export function isInBlackout(store: BlackoutStore, now: Date = new Date()): boolean {
  const hour = now.getUTCHours();
  const day = now.getUTCDay();
  return store.windows.some(w => {
    if (w.days && !w.days.includes(day)) return false;
    if (w.startHour <= w.endHour) {
      return hour >= w.startHour && hour < w.endHour;
    }
    // wraps midnight
    return hour >= w.startHour || hour < w.endHour;
  });
}

export function listBlackoutWindows(store: BlackoutStore): BlackoutWindow[] {
  return [...store.windows];
}
