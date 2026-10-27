import { spawn as defaultSpawn } from "node:child_process";
import { dumpCommand } from "./dump/command.mjs";
import { writeDump } from "./dump/writer.mjs";

export async function dumpTable(config, database, table, file, deps = {}) {
  const spawn = deps.spawn ?? defaultSpawn;
  const { command, args, options } = dumpCommand(config, database, table);
  const child = spawn(command, args, options);
  child.stdin.end(`${config.password}\n`);
  let errorOutput = "";
  child.stderr.on("data", (chunk) => {
    errorOutput += chunk;
  });
  const exited = new Promise((resolve, reject) => {
    child.on("error", reject);
    child.on("close", (code) => {
      if (code) reject(new Error(errorOutput || `mysqldump failed: ${code}`));
      else resolve();
    });
  });
  await Promise.all([exited, writeDump(child, file, deps)]);
}
