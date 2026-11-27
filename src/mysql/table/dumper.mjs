import { spawn as defaultSpawn } from "node:child_process";
import {
  mkdtemp as defaultMkdtemp,
  rm as defaultRm,
  unlink as defaultUnlink,
  writeFile as defaultWriteFile,
} from "node:fs/promises";
import path from "node:path";
import { tmpdir } from "node:os";
import waitForExit from "../../commands/wait-for-exit.mjs";
import dumpCommand from "../dump/command.mjs";
import writeDump from "../dump/writer.mjs";

function optionValue(value) {
  return `"${value.replaceAll("\\", "\\\\").replaceAll('"', '\\"').replaceAll("\n", "\\n").replaceAll("\r", "\\r").replaceAll("\t", "\\t")}"`;
}

export default async function dumpTable(config, database, table, file, deps = {}) {
  const spawn = deps.spawn ?? defaultSpawn;
  const unlink = deps.unlink ?? defaultUnlink;
  const mkdtemp = deps.mkdtemp ?? defaultMkdtemp;
  const rm = deps.rm ?? defaultRm;
  const writeFile = deps.writeFile ?? defaultWriteFile;
  const credentialsDir = await mkdtemp(path.join(deps.tmpdir ?? tmpdir(), "fc2s-mariadb-"));
  const credentialsFile = path.join(credentialsDir, "client.cnf");
  try {
    await writeFile(credentialsFile, `[client]\npassword=${optionValue(config.password)}\n`, {
      mode: 0o600,
    });
    const { command, args, options } = dumpCommand(config, database, table, credentialsFile);
    const child = spawn(command, args, { ...options, env: process.env });
    const exited = waitForExit(child, (code) => `mariadb-dump failed: ${code}`);
    const writing = writeDump(child, file, deps);
    try {
      child.stdin.end();
      await Promise.all([exited, writing]);
    } catch (error) {
      child.kill();
      await Promise.allSettled([exited, writing]);
      await unlink(file).catch(() => {});
      throw error;
    }
  } finally {
    await rm(credentialsDir, { recursive: true, force: true });
  }
}
