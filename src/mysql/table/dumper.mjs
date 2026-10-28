import { spawn as defaultSpawn } from "node:child_process";
import { waitForExit } from "../../commands/runner.mjs";
import { dumpCommand } from "../dump/command.mjs";
import { dumpEnvironment } from "../dump/environment.mjs";
import { writeDump } from "../dump/writer.mjs";

export async function dumpTable(config, database, table, file, deps = {}) {
  const spawn = deps.spawn ?? defaultSpawn;
  const { command, args, options } = dumpCommand(config, database, table);
  const child = spawn(command, args, { ...options, env: dumpEnvironment() });
  child.stdin.end(`${config.password}\n`);
  const exited = waitForExit(child, (code) => `mysqldump failed: ${code}`);
  await Promise.all([exited, writeDump(child, file, deps)]);
}
