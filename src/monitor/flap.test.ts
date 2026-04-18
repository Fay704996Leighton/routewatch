import { describe, it, expect } from "vitest";
import {
  createFlapDetector,
  recordFlapStatus,
  countTransitions,
  buildFlapReport,
} from "./flap";

describe("countTransitions", () => {
  it("returns 0 for uniform statuses", () => {
    expect(countTransitions([true, true, true])).toBe(0);
  });

  it("counts each change", () => {
    expect(countTransitions([true, false, true, false])).toBe(3);
  });

  it("returns 0 for single entry", () => {
    expect(countTransitions([true])).toBe(0);
  });
});

describe("recordFlapStatus", () => {
  it("accumulates statuses up to windowSize", () => {
    const state = createFlapDetector(3, 2);
    recordFlapStatus(state, "http://a", true);
    recordFlapStatus(state, "http://a", false);
    recordFlapStatus(state, "http://a", true);
    recordFlapStatus(state, "http://a", false);
    const hist = state.history.get("http://a")!;
    expect(hist.length).toBe(3);
  });
});

describe("buildFlapReport", () => {
  const ts = new Map([["http://api", { first: 1000, last: 2000 }]]);

  it("marks endpoint as flapping when transitions exceed threshold", () => {
    const state = createFlapDetector(6, 4);
    const statuses = [true, false, true, false, true, false];
    for (const s of statuses) recordFlapStatus(state, "http://api", s);
    const report = buildFlapReport(state, ts);
    const entry = report.entries.find((e) => e.url === "http://api")!;
    expect(entry.isFlapping).toBe(true);
    expect(report.flappingCount).toBe(1);
  });

  it("does not mark stable endpoint as flapping", () => {
    const state = createFlapDetector(6, 4);
    for (let i = 0; i < 6; i++) recordFlapStatus(state, "http://api", true);
    const report = buildFlapReport(state, ts);
    const entry = report.entries.find((e) => e.url === "http://api")!;
    expect(entry.isFlapping).toBe(false);
    expect(report.flappingCount).toBe(0);
  });

  it("does not flag flapping if window not yet full", () => {
    const state = createFlapDetector(10, 4);
    recordFlapStatus(state, "http://api", true);
    recordFlapStatus(state, "http://api", false);
    const report = buildFlapReport(state, ts);
    const entry = report.entries.find((e) => e.url === "http://api")!;
    expect(entry.isFlapping).toBe(false);
  });
});
