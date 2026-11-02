import type { ScanResult } from "../domain/types";
export function textReport(r: ScanResult): string {
  const omitted = r.findings.filter(
    (f) => f.state === "shared" && f.confidence === "uncertain",
  );
  const visible = r.findings.filter(
    (f) => !(f.state === "shared" && f.confidence === "uncertain"),
  );
  const lines = [
    `Leftover Inspector — ${r.platform}`,
    `Scanned: ${r.scannedAt}`,
    `Findings: ${visible.length}`,
    ...(omitted.length
      ? [
          `${omitted.length} protected shared item${omitted.length === 1 ? "" : "s"} omitted; use JSON output for the complete inventory.`,
        ]
      : []),
    "",
  ];
  for (const f of visible)
    lines.push(
      `${f.risk.toUpperCase().padEnd(8)} ${f.confidence.padEnd(9)} ${f.kind.padEnd(20)} ${f.path}\n  ${f.explanation}`,
    );
  if (r.errors.length) lines.push("", `Warnings: ${r.errors.join("; ")}`);
  return lines.join("\n");
}
