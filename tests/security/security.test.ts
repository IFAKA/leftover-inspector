import { describe, expect, test } from "bun:test";
import { validateActionPath } from "../../src/actions/validation";

describe("security", () => {
  test("hostile filenames remain data", () =>
    expect(validateActionPath("/tmp/$(touch PWNED)")).toBeNull());
  test("relative paths rejected", () =>
    expect(validateActionPath("../../secret")).toContain("absolute"));
});
