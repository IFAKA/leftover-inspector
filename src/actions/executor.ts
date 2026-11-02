import { newManifest } from "../domain/operations";
import type {
  FileSystemLike,
  OperationManifest,
  RemovalPlan,
} from "../domain/types";
export async function executePlan(
  plan: RemovalPlan,
  fs: FileSystemLike,
  confirm = false,
  root = "/tmp/leftover-inspector-recovery",
): Promise<OperationManifest> {
  const m = newManifest();
  if (plan.dryRun || !confirm) {
    m.completedAt = new Date().toISOString();
    return m;
  }
  for (const item of plan.items) {
    if (item.privileged) {
      m.entries.push({
        originalPath: item.source,
        destination: item.destination,
        timestamp: new Date().toISOString(),
        result: "skipped",
        error: "privileged confirmation unavailable",
      });
      continue;
    }
    try {
      await fs.mkdir?.(root);
      await fs.move?.(item.source, item.destination);
      m.entries.push({
        originalPath: item.source,
        destination: item.destination,
        timestamp: new Date().toISOString(),
        result: "moved",
        recovery: item.destination,
      });
    } catch (e) {
      m.entries.push({
        originalPath: item.source,
        destination: item.destination,
        timestamp: new Date().toISOString(),
        result: "failed",
        error: String(e),
      });
      break;
    }
  }
  m.completedAt = new Date().toISOString();
  return m;
}
