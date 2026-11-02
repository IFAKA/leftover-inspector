import { correlate } from "../../domain/correlate";
import type { CommandRunner, Finding } from "../../domain/types";
export async function scanHomebrew(
  command?: CommandRunner,
  now = new Date(),
): Promise<Finding[]> {
  if (!command) return [];
  const r = await command.run("brew", ["info", "--json=v2", "--installed"]);
  if (r.code !== 0) return [];
  try {
    const data = JSON.parse(r.stdout) as {
      casks?: Array<{ token: string; installed?: Array<{ bundle?: string }> }>;
    };
    return (data.casks ?? [])
      .filter((c) => !c.installed?.[0]?.bundle)
      .map((c) =>
        correlate(
          "macos",
          "homebrew-cask",
          `brew:cask:${c.token}`,
          "missing",
          [
            {
              source: "homebrew",
              value: c.token,
              strength: 4,
              observedAt: now.toISOString(),
            },
          ],
          { name: c.token, installPaths: [], installed: false },
          "broken-install",
        ),
      );
  } catch {
    return [];
  }
}
