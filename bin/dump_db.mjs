import { pathToFileURL } from "node:url";
import { dumpDatabase } from "../src/bin/dump-db.mjs";

export async function runDump(dbName, deps = {}) {
  try {
    const archive = await dumpDatabase(dbName, deps);
    (deps.log ?? console.log)(archive);
    return archive;
  } catch (error) {
    (deps.error ?? console.error)(error.stack || error.message);
    globalThis.process.exitCode = 1;
  }
}

if (
  globalThis.process.argv[1] &&
  import.meta.url === pathToFileURL(globalThis.process.argv[1]).href
) {
  await runDump(globalThis.process.argv[2]);
}
