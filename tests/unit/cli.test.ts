import { describe, expect, test } from "bun:test";
import { parseArgs } from "../../src/cli";
import { correlate } from "../../src/domain/correlate";
import { textReport } from "../../src/report/text";

describe("cli", () =>
  test("parses scan options", () =>
    expect(
      parseArgs([
        "scan",
        "--dry-run",
        "--json",
        "x.json",
        "--fixture",
        "fixtures",
        "--no-color",
      ]),
    ).toEqual({
      command: "scan",
      dryRun: true,
      json: "x.json",
      fixture: "fixtures",
      noColor: true,
      tui: false,
    })));

describe("text report signal", () => {
  test("does not print uncertain shared directories by default", () => {
    const shared = correlate(
      "macos",
      "container",
      "/Users/test/Library/Group Containers/example",
      "directory",
      [{ source: "filesystem", value: "x", strength: 6 }],
      undefined,
      "shared",
    );
    const report = textReport({
      platform: "macos",
      findings: [shared],
      errors: [],
      permissions: [],
      scannedAt: "now",
    });
    expect(report).toContain("1 protected shared item omitted");
    expect(report).not.toContain(
      "/Users/test/Library/Group Containers/example",
    );
  });
});
