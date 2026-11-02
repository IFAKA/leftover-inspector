import type { PlatformId } from "../domain/types";
export function detectPlatform(value = process.platform): PlatformId {
  if (value === "darwin") return "macos";
  if (value === "win32") return "windows";
  return "linux";
}
