import { describe, expect, test } from "bun:test";
import { executePlan } from "../../src/actions/executor";
import type { FileSystemLike } from "../../src/domain/types";

describe("transaction safety", () => {
  test("dry-run never calls filesystem mutation methods", async () => {
    let mutations = 0;
    const fs: FileSystemLike = {
      stat: async () => ({ type: "file", size: 1 }),
      readFile: async () => "",
      readdir: async () => [],
      exists: async () => true,
      mkdir: async () => {
        mutations++;
      },
      move: async () => {
        mutations++;
      },
    };
    const manifest = await executePlan(
      {
        items: [
          {
            findingId: "x",
            source: "/tmp/x",
            destination: "/tmp/recovery/x",
            action: "quarantine",
            privileged: false,
          },
        ],
        dryRun: true,
        errors: [],
      },
      fs,
      true,
    );
    expect(mutations).toBe(0);
    expect(manifest.entries).toHaveLength(0);
  });
});
