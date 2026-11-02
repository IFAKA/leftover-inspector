import type { Action, Finding } from "./types";
export const PROTECTED_PARTS = [
  "/.ssh/",
  "/Keychains/",
  "/Library/Keychains/",
  "/.config/google-chrome/",
  "/Library/Safari/",
  "/databases/",
  "/var/db/",
];
export function isProtectedPath(path: string): boolean {
  const p = path.replaceAll("\\", "/");
  return (
    PROTECTED_PARTS.some((part) => p.includes(part)) ||
    p === "/" ||
    p === "/Applications" ||
    p === "/System" ||
    p === "/Library"
  );
}
export function defaultAction(f: Finding): Action {
  if (
    f.state === "shared" ||
    f.state === "system-owned" ||
    f.confidence === "uncertain" ||
    f.risk === "elevated"
  )
    return "inspect";
  if (f.kind === "launch-agent" || f.kind === "launch-daemon")
    return "admin-required";
  return f.action === "ignore" ? "inspect" : f.action;
}
