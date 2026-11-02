import { correlate } from "../../domain/correlate";
import type {
  Evidence,
  FileSystemLike,
  Finding,
  ScanContext,
  ScanResult,
} from "../../domain/types";

const areas = [
  "Library/LaunchAgents",
  "Library/LaunchDaemons",
  "Library/Application Support",
  "Library/Preferences",
  "Library/Containers",
  "Library/Group Containers",
  "Library/PrivilegedHelperTools",
];
async function children(fs: FileSystemLike, p: string) {
  try {
    return await fs.readdir(p);
  } catch {
    return [];
  }
}
async function entry(fs: FileSystemLike, p: string) {
  try {
    return await fs.stat(p);
  } catch {
    return { type: "missing" as const, size: 0 };
  }
}
export async function scanMac(context: ScanContext): Promise<ScanResult> {
  const findings: Finding[] = [];
  const errors: string[] = [];
  const now = (context.now ?? new Date()).toISOString();
  for (const root of context.roots) {
    for (const area of areas) {
      const dir = `${root}/${area}`;
      for (const name of await children(context.fs, dir)) {
        const path = `${dir}/${name}`,
          st = await entry(context.fs, path);
        const kind = area.includes("Launch")
          ? area.includes("Daemons")
            ? "launch-daemon"
            : "launch-agent"
          : area.includes("Containers")
            ? "container"
            : area.includes("Preferences")
              ? "preference"
              : area.includes("Privileged")
                ? "privileged-helper"
                : area.includes("Application Support")
                  ? "application-support"
                  : "app-remnant";
        let evidence: Evidence[] = [
          { source: "filesystem", value: path, strength: 6, observedAt: now },
        ];
        let state: "unknown" | "shared" = "unknown";
        if (
          area.includes("Group Containers") ||
          area.includes("Application Support")
        )
          state = "shared";
        if (area.includes("Launch")) {
          try {
            const xml = await context.fs.readFile(path);
            const exec = xml.match(
              /<key>(?:Program|ProgramArguments)<\/key>\s*<[^>]+>([^<]+)/,
            )?.[1];
            if (exec)
              evidence = [
                {
                  source: "launchd",
                  value: exec,
                  strength: 3,
                  observedAt: now,
                },
                ...evidence,
              ];
            if (exec && !(await context.fs.exists(exec)))
              findings.push(
                correlate(
                  "macos",
                  kind,
                  path,
                  st.type,
                  evidence,
                  undefined,
                  "missing-app",
                  st.size,
                ),
              );
            else
              findings.push(
                correlate(
                  "macos",
                  kind,
                  path,
                  st.type,
                  evidence,
                  undefined,
                  state,
                  st.size,
                ),
              );
          } catch (e) {
            findings.push(
              correlate(
                "macos",
                kind,
                path,
                st.type,
                evidence,
                undefined,
                state,
                st.size,
                [String(e)],
              ),
            );
          }
        } else
          findings.push(
            correlate(
              "macos",
              kind,
              path,
              st.type,
              evidence,
              undefined,
              state,
              st.size,
            ),
          );
      }
    }
  }
  return {
    platform: "macos",
    findings,
    errors,
    permissions: [],
    scannedAt: now,
  };
}
