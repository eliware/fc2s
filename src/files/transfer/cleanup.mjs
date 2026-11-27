import { rm as defaultRm } from "node:fs/promises";

export default async function cleanupPartialFile(file, remove = defaultRm) {
  await remove(file, { force: true });
}
