import { spawn as defaultSpawn } from "node:child_process";

export function run(command, args, options = {}, deps = {}) {
  const spawn = deps.spawn ?? defaultSpawn;
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, options);
    let output = "";
    let errorOutput = "";
    child.stdout?.on("data", (chunk) => {
      output += chunk;
    });
    child.stderr?.on("data", (chunk) => {
      errorOutput += chunk;
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code) reject(new Error(errorOutput || `command failed: ${code}`));
      else resolve(output);
    });
  });
}
