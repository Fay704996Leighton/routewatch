import { describe, it, expect } from "vitest";
import {
  createBlackoutStore,
  addBlackoutWindow,
  removeBlackoutWindow,
  isInBlackout,
  listBlackoutWindows,
} from "./blackout";

function utcDate(hour: number, day = 1 /* Monday */): Date {
  const d = new Date(0);
  d.setUTCFullYear(2024, 0, 1 + day); // week starting Jan 1 2024 (Mon)
  d.setUTCHours(hour, 0, 0, 0);
  return d;
}

describe("blackout", () => {
  it("starts empty", () => {
    const store = createBlackoutStore();
    expect(isInBlackout(store)).toBe(false);
  });

  it("detects in-window hour", () => {
    const store = createBlackoutStore();
    addBlackoutWindow(store, { id: "w1", startHour: 2, endHour: 4 });
    expect(isInBlackout(store, utcDate(3))).toBe(true);
    expect(isInBlackout(store, utcDate(5))).toBe(false);
  });

  it("handles midnight wrap", () => {
    const store = createBlackoutStore();
    addBlackoutWindow(store, { id: "w2", startHour: 22, endHour: 2 });
    expect(isInBlackout(store, utcDate(23))).toBe(true);
    expect(isInBlackout(store, utcDate(1))).toBe(true);
    expect(isInBlackout(store, utcDate(10))).toBe(false);
  });

  it("respects day filter", () => {
    const store = createBlackoutStore();
    addBlackoutWindow(store, { id: "w3", startHour: 0, endHour: 24, days: [6] }); // Saturday only
    const monday = utcDate(12, 0);
    expect(isInBlackout(store, monday)).toBe(false);
  });

  it("removes window", () => {
    const store = createBlackoutStore();
    addBlackoutWindow(store, { id: "w4", startHour: 0, endHour: 24 });
    expect(isInBlackout(store, utcDate(12))).toBe(true);
    const removed = removeBlackoutWindow(store, "w4");
    expect(removed).toBe(true);
    expect(isInBlackout(store, utcDate(12))).toBe(false);
  });

  it("returns false when removing unknown id", () => {
    const store = createBlackoutStore();
    expect(removeBlackoutWindow(store, "nope")).toBe(false);
  });

  it("lists windows", () => {
    const store = createBlackoutStore();
    addBlackoutWindow(store, { id: "a", startHour: 1, endHour: 2 });
    addBlackoutWindow(store, { id: "b", startHour: 3, endHour: 4 });
    expect(listBlackoutWindows(store)).toHaveLength(2);
  });
});
