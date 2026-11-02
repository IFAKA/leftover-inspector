import { describe, expect, test } from "bun:test";
import type { FileSystemLike } from "../../src/domain/types";
import { scanLinux } from "../../src/platform/linux/scan";
import { scanMac } from "../../src/platform/macos/scan";
import { scanWindows } from "../../src/platform/windows/scan";

function fixture(files: Record<string, string>): FileSystemLike {
  return {
    async stat(p) {
      if (!(p in files)) throw Error("missing");
      return { type: "file", size: files[p].length };
    },
    async readFile(p) {
      return files[p] ?? "";
    },
    async readdir(p) {
      const pre = p.endsWith("/") ? p : p + "/";
      return Object.keys(files)
        .filter((k) => k.startsWith(pre))
        .map((k) => k.slice(pre.length).split("/")[0])
        .filter((v, i, a) => v && a.indexOf(v) === i);
    },
    async exists(p) {
      return p in files;
    },
  };
}
describe("fixture scanners", () => {
  test("macOS detects orphan launch agent", async () => {
    const r = await scanMac({
      platform: "macos",
      roots: ["/fixture"],
      fs: fixture({
        "/fixture/Library/LaunchAgents/com.example.plist":
          "<key>Program</key><string>/missing/tool</string>",
      }),
    });
    expect(r.findings[0].state).toBe("missing-app");
  });
  test("linux and windows scan", async () => {
    const fs = fixture({
      "/f/.config/autostart/a.desktop": "x",
      "/f/Startup/a.lnk": "x",
    });
    expect(
      (await scanLinux({ platform: "linux", roots: ["/f"], fs })).findings,
    ).toHaveLength(1);
    expect(
      (await scanWindows({ platform: "windows", roots: ["/f"], fs })).findings,
    ).toHaveLength(1);
  });
});
