import { correlate } from "../../domain/correlate";
import type { ScanContext, ScanResult } from "../../domain/types";
export async function scanWindows(c: ScanContext): Promise<ScanResult> {
  const findings = [];
  const now = (c.now ?? new Date()).toISOString();
  for (const root of c.roots) {
    for (const area of ["AppData", "LocalAppData", "ProgramData", "Startup"]) {
      const dir = `${root}/${area}`;
      for (const name of await c.fs.readdir(dir).catch(() => [])) {
        const path = `${dir}/${name}`;
        const st = await c.fs
          .stat(path)
          .catch(() => ({ type: "missing" as const, size: 0 }));
        findings.push(
          correlate(
            "windows",
            area === "Startup" ? "startup" : "app-remnant",
            path,
            st.type,
            [
              {
                source: "filesystem",
                value: path,
                strength: 6,
                observedAt: now,
              },
            ],
            undefined,
            "unknown",
            st.size,
          ),
        );
      }
    }
  }
  return {
    platform: "windows",
    findings,
    errors: [],
    permissions: [],
    scannedAt: now,
  };
}
