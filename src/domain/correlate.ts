import { confidenceFor, riskFor } from "./score";
import type {
  AppIdentity,
  Evidence,
  Finding,
  FindingKind,
  PathType,
  PlatformId,
} from "./types";
export function stableId(
  platform: PlatformId,
  path: string,
  kind: FindingKind,
): string {
  return `${platform}:${kind}:${path.replaceAll("\\", "/").toLowerCase()}`;
}
export function correlate(
  platform: PlatformId,
  kind: FindingKind,
  path: string,
  pathType: PathType,
  evidence: Evidence[],
  app?: AppIdentity,
  state: Finding["state"] = "unknown",
  sizeBytes = 0,
  errors: string[] = [],
): Finding {
  const sorted = [...evidence].sort((a, b) => a.strength - b.strength);
  const confidence = confidenceFor(sorted, state);
  const risk = riskFor(state, kind, path);
  const action =
    state === "broken-install" || state === "missing-app"
      ? "quarantine"
      : "inspect";
  const explanation =
    state === "broken-install"
      ? "A package or installer record exists, but its application payload is missing or incomplete."
      : state === "missing-app"
        ? "This item has ownership evidence, but the owning application was not found in configured install roots."
        : state === "shared"
          ? "This directory may serve multiple applications and is protected from automatic selection."
          : `Detected ${kind} with ${sorted.length} evidence item${sorted.length === 1 ? "" : "s"}.`;
  return {
    id: stableId(platform, path, kind),
    platform,
    kind,
    path,
    pathType,
    app,
    evidence: sorted,
    state,
    confidence,
    risk,
    sizeBytes,
    scanErrors: errors,
    action,
    explanation,
    selected: false,
  };
}
