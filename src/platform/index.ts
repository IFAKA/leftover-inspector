import type { ScanContext, ScanResult } from "../domain/types";
import { detectPlatform } from "./detect";
import { scanLinux } from "./linux/scan";
import { scanMac } from "./macos/scan";
import { scanWindows } from "./windows/scan";
export async function scanPlatform(c: ScanContext): Promise<ScanResult> {
  switch (c.platform) {
    case "macos":
      return scanMac(c);
    case "windows":
      return scanWindows(c);
    default:
      return scanLinux(c);
  }
}
export function defaultRoots(platform = detectPlatform()): string[] {
  if (platform === "macos")
    return [process.env.HOME ?? "/Users/unknown", "/Applications"];
  if (platform === "windows")
    return [
      process.env.APPDATA ?? "C:/Users/unknown",
      process.env.LOCALAPPDATA ?? "C:/Users/unknown",
    ];
  return [process.env.HOME ?? "/home/unknown"];
}
