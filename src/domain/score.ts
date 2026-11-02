import type { Confidence, Evidence, FindingState, Risk } from "./types";
export function confidenceFor(
  evidence: Evidence[],
  state: FindingState,
): Confidence {
  if (state === "installed") return "certain";
  if (evidence.some((e) => e.strength <= 3)) return "likely";
  return "uncertain";
}
export function riskFor(state: FindingState, kind: string, path: string): Risk {
  if (
    state === "system-owned" ||
    state === "shared" ||
    kind === "privileged-helper" ||
    /(^|\/)\.ssh(\/|$)|Keychains|LaunchDaemons/.test(path)
  )
    return "elevated";
  if (state === "unknown" || kind === "package-record" || kind === "preference")
    return "review";
  return "safe";
}
