import type { OperationManifest } from "./types";
export function newManifest(now = new Date()): OperationManifest {
  return {
    version: 1,
    operationId: crypto.randomUUID(),
    startedAt: now.toISOString(),
    entries: [],
  };
}
