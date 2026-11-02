import { describe, expect, test } from "bun:test";
import { correlate } from "../../src/domain/correlate";
import { keymap } from "../../src/ui/keymap";
import {
  jumpCursor,
  makeUiState,
  moveCursor,
  pageCursor,
  setError,
  setView,
  toggleSelection,
  visibleFindings,
  windowedFindings,
} from "../../src/ui/model";
import { findingTableHeader } from "../../src/ui/tui";

const findings = [
  correlate(
    "macos",
    "launch-agent",
    "/Users/test/Library/LaunchAgents/example.plist",
    "file",
    [{ source: "launchd", value: "/missing/example", strength: 3 }],
    undefined,
    "missing-app",
  ),
  correlate(
    "macos",
    "container",
    "/Users/test/Library/Containers/example",
    "directory",
    [{ source: "filesystem", value: "x", strength: 6 }],
    undefined,
    "shared",
  ),
];

describe("TUI interaction model", () => {
  test("keeps the primary controls discoverable for Vim and non-Vim users", () => {
    expect(keymap.copyPath).toBe("y");
    expect(keymap.help).toContain("f1");
  });

  test("labels the findings columns", () => {
    expect(findingTableHeader()).toContain("RISK");
    expect(findingTableHeader()).toContain("TYPE");
    expect(findingTableHeader()).toContain("PATH");
  });

  test("turns thrown errors into a recoverable UI state", () => {
    const state = setError(
      makeUiState(findings),
      new Error("permission denied"),
    );
    expect(state.view).toBe("error");
    expect(state.error).toBe("permission denied");
  });

  test("cursor, selection, search, and view transitions are deterministic", () => {
    let state = makeUiState(findings);
    state = moveCursor(state, 1);
    expect(state.cursor).toBe(1);
    state = toggleSelection(state);
    expect(state.findings[1].selected).toBe(true);
    state.query = "launch-agent";
    expect(visibleFindings(state)).toHaveLength(1);
    expect(setView(state, "detail").view).toBe("detail");
  });

  test("windowing keeps large lists bounded and preserves global cursor positions", () => {
    const many = Array.from({ length: 1_000 }, (_, i) =>
      correlate("linux", "autostart", `/tmp/finding-${i}`, "file", [
        { source: "fixture", value: String(i), strength: 6 },
      ]),
    );
    let state = makeUiState(many);
    state = jumpCursor(state, "last");
    const window = windowedFindings(state, 40);
    expect(window.findings).toHaveLength(40);
    expect(window.start + window.findings.length).toBe(1_000);
    expect(window.findings.at(-1)?.path).toBe("/tmp/finding-999");
    expect(pageCursor(state, -1, 15).cursor).toBe(984);
  });
});
