import { describe, it, expect, beforeEach } from "vitest";
import { mkdtempSync, writeFileSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { createMuteStore } from "./mute";

function tmpFile(): string {
  const dir = mkdtempSync(join(tmpdir(), "mute-"));
  return join(dir, "mute.json");
}

describe("createMuteStore", () => {
  let path: string;

  beforeEach(() => {
    path = tmpFile();
  });

  it("mutes a route indefinitely", () => {
    const store = createMuteStore(path);
    store.muteRoute("https://api.example.com/health", "maintenance");
    expect(store.isMuted("https://api.example.com/health")).toBe(true);
  });

  it("unmutes a route", () => {
    const store = createMuteStore(path);
    store.muteRoute("https://api.example.com/health", "test");
    store.unmuteRoute("https://api.example.com/health");
    expect(store.isMuted("https://api.example.com/health")).toBe(false);
  });

  it("respects TTL expiry", () => {
    const store = createMuteStore(path);
    store.muteRoute("https://api.example.com/v1", "short", -1);
    expect(store.isMuted("https://api.example.com/v1")).toBe(false);
  });

  it("purges expired rules", () => {
    const store = createMuteStore(path);
    store.muteRoute("https://a.com", "x", -100);
    store.muteRoute("https://b.com", "y");
    store.purgeExpired();
    expect(store.list()).toHaveLength(1);
    expect(store.list()[0].url).toBe("https://b.com");
  });

  it("lists all active rules", () => {
    const store = createMuteStore(path);
    store.muteRoute("https://a.com", "r1");
    store.muteRoute("https://b.com", "r2");
    expect(store.list()).toHaveLength(2);
  });

  it("replaces existing rule for same url", () => {
    const store = createMuteStore(path);
    store.muteRoute("https://a.com", "first");
    store.muteRoute("https://a.com", "second");
    const rules = store.list();
    expect(rules).toHaveLength(1);
    expect(rules[0].reason).toBe("second");
  });
});
