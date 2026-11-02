import { defaultAction } from "../domain/policy";
import type { Finding, RemovalPlan } from "../domain/types";
import { validateActionPath } from "./validation";
export function planRemoval(
  findings: Finding[],
  dryRun = true,
  quarantineRoot = "/tmp/leftover-inspector-recovery",
): RemovalPlan {
  const items = [];
  const errors = [];
  for (const f of findings) {
    const action = defaultAction(f);
    if (
      !f.selected ||
      !["trash", "quarantine", "admin-required"].includes(action)
    )
      continue;
    const err = validateActionPath(f.path);
    if (err) {
      errors.push(`${f.path}: ${err}`);
      continue;
    }
    items.push({
      findingId: f.id,
      source: f.path,
      destination: `${quarantineRoot}/${f.id.replaceAll("/", "_")}`,
      action,
      privileged: action === "admin-required",
    });
  }
  return { items, dryRun, errors };
}
