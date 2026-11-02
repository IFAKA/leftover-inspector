import type { Finding } from "../domain/types";
export interface UiState {
  findings: Finding[];
  cursor: number;
  query: string;
  risk?: string;
  confidence?: string;
  selectedOnly: boolean;
  view:
    | "summary"
    | "findings"
    | "detail"
    | "dry-run"
    | "confirm"
    | "history"
    | "error";
  error?: string;
}
export function makeUiState(findings: Finding[]): UiState {
  return {
    findings,
    cursor: 0,
    query: "",
    selectedOnly: false,
    view: "summary",
  };
}
export function visibleFindings(s: UiState): Finding[] {
  return s.findings.filter(
    (f) =>
      (!s.query ||
        `${f.path} ${f.kind} ${f.app?.name ?? ""}`
          .toLowerCase()
          .includes(s.query.toLowerCase())) &&
      (!s.risk || f.risk === s.risk) &&
      (!s.confidence || f.confidence === s.confidence) &&
      (!s.selectedOnly || f.selected),
  );
}

/** Keep terminal rendering bounded even when the scan returns many rows. */
export function windowedFindings(
  s: UiState,
  maxRows = 200,
): { findings: Finding[]; start: number; total: number } {
  const all = visibleFindings(s);
  if (all.length <= maxRows)
    return { findings: all, start: 0, total: all.length };
  const half = Math.floor(maxRows / 2);
  const start = Math.max(0, Math.min(s.cursor - half, all.length - maxRows));
  return {
    findings: all.slice(start, start + maxRows),
    start,
    total: all.length,
  };
}

export function jumpCursor(s: UiState, position: "first" | "last"): UiState {
  const count = visibleFindings(s).length;
  return {
    ...s,
    cursor: count === 0 ? 0 : position === "first" ? 0 : count - 1,
  };
}

export function pageCursor(
  s: UiState,
  direction: -1 | 1,
  pageSize = 15,
): UiState {
  return moveCursor(s, direction * pageSize);
}
export function toggleSelection(s: UiState): UiState {
  const fs = [...s.findings];
  const v = visibleFindings(s)[s.cursor];
  if (v) {
    const i = fs.findIndex((f) => f.id === v.id);
    fs[i] = { ...fs[i], selected: !fs[i].selected };
  }
  return { ...s, findings: fs };
}

export function moveCursor(s: UiState, delta: number): UiState {
  const count = visibleFindings(s).length;
  return {
    ...s,
    cursor:
      count === 0 ? 0 : Math.max(0, Math.min(count - 1, s.cursor + delta)),
  };
}

export function setView(s: UiState, view: UiState["view"]): UiState {
  return { ...s, view };
}

export function setError(s: UiState, error: unknown): UiState {
  return {
    ...s,
    view: "error",
    error: error instanceof Error ? error.message : String(error),
  };
}
