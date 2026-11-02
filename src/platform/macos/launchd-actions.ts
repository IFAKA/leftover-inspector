import type { CommandRunner } from "../../domain/types";
export function launchdBootoutPlan(
  domain: string,
  plist: string,
): { file: string; args: string[]; plist: string } {
  return { file: "launchctl", args: ["bootout", domain, plist], plist };
}
export async function unloadLaunchd(
  command: CommandRunner,
  domain: string,
  plist: string,
  confirmed: boolean,
): Promise<{ ok: boolean; error?: string }> {
  if (!confirmed) return { ok: false, error: "explicit confirmation required" };
  const p = launchdBootoutPlan(domain, plist);
  const r = await command.run(p.file, p.args);
  return r.code === 0
    ? { ok: true }
    : { ok: false, error: r.stderr || "launchctl failed" };
}
