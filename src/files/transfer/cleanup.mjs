import { rm as defaultRm } from "node:fs/promises";

export default async function cleanupPartialFile(file, operationError, remove = defaultRm) {
  try {
    await remove(file, { force: true });
  } catch (cleanupError) {
    throw new AggregateError([operationError, cleanupError], "Download and cleanup failed", {
      cause: operationError,
    });
  }
}
