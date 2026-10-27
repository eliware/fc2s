import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { log } from "../debug.mjs";

export async function tempDir() {
  const directory = await mkdtemp(path.join(tmpdir(), "fc2s-"));
  log("temporary directory", directory);
  return directory;
}
