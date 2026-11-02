import { isProtectedPath } from "../domain/policy";
export function validateActionPath(path: string, root?: string): string | null {
  if (!path || !path.startsWith("/")) {
    if (!/^[A-Za-z]:[\\/]/.test(path)) return "path must be absolute";
  }
  if (path.includes("\0")) return "NUL byte rejected";
  if (path.split(/[\\/]/).includes("..")) return "path traversal rejected";
  if (isProtectedPath(path)) return "protected path";
  if (root && !path.startsWith(root + "/") && path !== root)
    return "path outside allowed root";
  return null;
}
