import path from "node:path";
import { mkdtemp, rename, rm, stat } from "node:fs/promises";

export async function atomicArchive(output, create, dependencies = {}) {
  const d = { mkdtemp, rename, rm, stat, ...dependencies };
  const directory = await d.mkdtemp(path.join(path.dirname(output), ".fc2s-archive-"));
  const temporary = path.join(directory, path.basename(output));
  let operationError;
  try {
    await create(temporary);
    if ((await d.stat(temporary)).size === 0) throw new Error("Empty archive");
    await d.rename(temporary, output);
  } catch (error) {
    operationError = error;
  }
  try {
    await d.rm(directory, { recursive: true, force: true });
  } catch (error) {
    if (!operationError) operationError = error;
  }
  if (operationError) throw operationError;
  return output;
}
