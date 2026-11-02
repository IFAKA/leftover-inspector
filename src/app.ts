import type { Finding } from "./domain/types";
import { startInteractiveTui } from "./ui/tui";
export async function startTui(
  findings: Finding[],
  initialDryRun = false,
): Promise<void> {
  await startInteractiveTui(findings, initialDryRun);
}
