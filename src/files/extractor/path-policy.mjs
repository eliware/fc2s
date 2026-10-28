import { lstat } from "node:fs/promises";
import path from "node:path";

export function resolveEntry(output, entryName) {
  const root = path.resolve(output);
  const target = path.resolve(output, entryName);
  if (target !== root && !target.startsWith(`${root}${path.sep}`)) {
    throw new Error("Unsafe ZIP path");
  }
  return target;
}

export async function assertNoSymlinkPath(root, target) {
  const relative = path.relative(root, target);
  if (!relative) return;
  let current = root;
  for (const segment of relative.split(path.sep)) {
    current = path.join(current, segment);
    try {
      if ((await lstat(current)).isSymbolicLink()) throw new Error("Unsafe ZIP symlink path");
    } catch (error) {
      if (error.code === "ENOENT") return;
      throw error;
    }
  }
}
