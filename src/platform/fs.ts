import { mkdir, readdir, rename, stat } from "node:fs/promises";
import type { FileSystemLike } from "../domain/types";
export const nativeFs: FileSystemLike = {
  async stat(p) {
    const s = await stat(p);
    return {
      type: s.isSymbolicLink()
        ? "symlink"
        : s.isDirectory()
          ? "directory"
          : "file",
      size: s.size,
      mode: s.mode,
    };
  },
  async readFile(p) {
    return Bun.file(p).text();
  },
  async readdir(p) {
    return readdir(p);
  },
  async exists(p) {
    try {
      await stat(p);
      return true;
    } catch {
      return false;
    }
  },
  async move(a, b) {
    await rename(a, b);
  },
  async mkdir(p) {
    await mkdir(p, { recursive: true });
  },
};
