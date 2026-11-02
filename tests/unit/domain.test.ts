import { describe, expect, test } from "bun:test";
import { planRemoval } from "../../src/actions/planner";
import { validateActionPath } from "../../src/actions/validation";
import { correlate, stableId } from "../../src/domain/correlate";

describe("domain safety", () => {
  test("stable IDs normalize", () =>
    expect(stableId("macos", "/A/B", "preference")).toBe(
      "macos:preference:/a/b",
    ));
  test("shared findings are inspect-only", () => {
    const f = correlate(
      "macos",
      "shared-directory",
      "/tmp/shared",
      "directory",
      [{ source: "name", value: "shared", strength: 6 }],
      undefined,
      "shared",
    );
    f.selected = true;
    expect(planRemoval([f]).items).toHaveLength(0);
  });
  test("rejects traversal and protected paths", () => {
    expect(validateActionPath("/tmp/../etc/passwd")).toContain("traversal");
    expect(validateActionPath("/Users/a/.ssh/id_rsa")).toContain("protected");
  });
});
