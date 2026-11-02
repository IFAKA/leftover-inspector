import type { FileSystemLike, OperationManifest } from "../domain/types";
export async function rollback(
  manifest: OperationManifest,
  fs: FileSystemLike,
): Promise<OperationManifest> {
  for (const entry of [...manifest.entries].reverse())
    if (entry.result === "moved" && entry.recovery) {
      try {
        await fs.move?.(entry.recovery, entry.originalPath);
        entry.result = "skipped";
      } catch (error) {
        entry.result = "failed";
        entry.error = String(error);
        break;
      }
    }
  manifest.rolledBack = true;
  return manifest;
}
