import type { UiState } from "./model";
import { visibleFindings } from "./model";
export function renderText(s: UiState): string {
  const fs = visibleFindings(s);
  return [
    `LEFTOVER INSPECTOR  [${s.view}]`,
    `${fs.length} visible / ${s.findings.length} total`,
    ...fs.map(
      (f, i) =>
        `${i === s.cursor ? ">" : " "} ${f.selected ? "[x]" : "[ ]"} ${f.risk} ${f.kind} ${f.path}`,
    ),
  ].join("\n");
}
