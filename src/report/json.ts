import type { ScanResult } from "../domain/types";
export function jsonReport(result: ScanResult, redact = false): string {
  const copy = redact
    ? JSON.parse(
        JSON.stringify(result, (k, v) =>
          k === "path"
            ? String(v).replace(/^\/Users\/[^/]+/g, "/Users/<user>")
            : v,
        ),
      )
    : result;
  const byRisk: Record<string, number> = {};
  for (const f of result.findings) byRisk[f.risk] = (byRisk[f.risk] ?? 0) + 1;
  return JSON.stringify(
    {
      schemaVersion: 1,
      ...copy,
      summary: { total: result.findings.length, byRisk },
    },
    null,
    2,
  );
}
