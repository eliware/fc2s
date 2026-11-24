import { lstat } from "node:fs/promises";
import path from "node:path";

export default async function assertNoSymlinkPath(root, target) {
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
