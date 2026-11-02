import { describe, expect, test } from "bun:test";
import { correlate } from "../../src/domain/correlate";
import {
  makeUiState,
  toggleSelection,
  visibleFindings,
} from "../../src/ui/model";

const f = correlate("linux", "autostart", "/tmp/a", "file", [
  { source: "x", value: "x", strength: 6 },
]);
describe("ui model", () =>
  test("search and selection", () => {
    let s = makeUiState([f]);
    s.query = "autostart";
    expect(visibleFindings(s)).toHaveLength(1);
    s = toggleSelection(s);
    expect(s.findings[0].selected).toBe(true);
  }));
