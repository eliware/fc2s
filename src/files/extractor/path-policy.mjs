import path from "node:path";

export function resolveEntry(output, entryName) {
  const root = path.resolve(output);
  const target = path.resolve(output, entryName);
  if (!target.startsWith(`${root}${path.sep}`)) throw new Error("Unsafe ZIP path");
  return target;
}
