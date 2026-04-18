import { describe, it, expect, vi, beforeEach } from "vitest";
import { mkdtempSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { runMuteCommand } from "./mute-command";

function tmpStore(): string {
  const dir = mkdtempSync(join(tmpdir(), "mute-cmd-"));
  return join(dir, "mute.json");
}

describe("runMuteCommand", () => {
  let storePath: string;
  let logs: string[];

  beforeEach(() => {
    storePath = tmpStore();
    logs = [];
    vi.spyOn(console, "log").mockImplementation((...args) =>
      void logs.push(args.join(" "))
    );
  });

  it("mutes a route permanently", () => {
    runMuteCommand({ action: "mute", url: "https://a.com", reason: "test", storePath });
    expect(logs[0]).toContain("Muted https://a.com");
    expect(logs[0]).toContain("permanent");
  });

  it("mutes a route with TTL", () => {
    runMuteCommand({ action: "mute", url: "https://a.com", reason: "x", ttl: 60, storePath });
    expect(logs[0]).toContain("expires in 60s");
  });

  it("unmutes a route", () => {
    runMuteCommand({ action: "mute", url: "https://a.com", reason: "x", storePath });
    runMuteCommand({ action: "unmute", url: "https://a.com", storePath });
    expect(logs[1]).toContain("Unmuted");
  });

  it("lists muted routes", () => {
    runMuteCommand({ action: "mute", url: "https://a.com", reason: "r1", storePath });
    runMuteCommand({ action: "list", storePath });
    expect(logs.some((l) => l.includes("https://a.com"))).toBe(true);
  });

  it("lists empty when none muted", () => {
    runMuteCommand({ action: "list", storePath });
    expect(logs[0]).toContain("No muted routes");
  });

  it("throws if url missing for mute", () => {
    expect(() =>
      runMuteCommand({ action: "mute", storePath })
    ).toThrow("--url is required");
  });
});
