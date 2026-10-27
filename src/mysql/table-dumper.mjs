import { spawn as defaultSpawn } from "node:child_process";
import { createWriteStream as defaultCreateWriteStream } from "node:fs";
import { pipeline as defaultPipeline } from "node:stream/promises";

export async function dumpTable(config, database, table, file, deps = {}) {
  const spawn = deps.spawn ?? defaultSpawn;
  const pipeline = deps.pipeline ?? defaultPipeline;
  const createWriteStream = deps.createWriteStream ?? defaultCreateWriteStream;
  const child = spawn(
    "mysqldump",
    [
      "--no-defaults",
      "--password",
      "--single-transaction",
      "--skip-comments",
      "--host",
      config.host,
      "--port",
      String(config.port),
      "--user",
      config.user,
      ...(config.sslCa ? ["--ssl", "--ssl-ca", config.sslCa, "--ssl-verify-server-cert"] : []),
      database,
      table,
    ],
    { stdio: ["pipe", "pipe", "pipe"], env: { ...process.env, MYSQL_PWD: "", MARIADB_PWD: "" } },
  );
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
  await Promise.all([exited, pipeline(child.stdout, createWriteStream(file))]);
}
