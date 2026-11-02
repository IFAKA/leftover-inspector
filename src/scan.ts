import type { PlatformId, ScanResult } from "./domain/types";
import { defaultRoots, scanPlatform } from "./platform";
import { detectPlatform } from "./platform/detect";
import { nativeFs } from "./platform/fs";
export async function scan(
  options: { platform?: PlatformId; roots?: string[] } = {},
): Promise<ScanResult> {
  const platform = options.platform ?? detectPlatform();
  return scanPlatform({
    platform,
    roots: options.roots ?? defaultRoots(platform),
    fs: nativeFs,
  });
}
