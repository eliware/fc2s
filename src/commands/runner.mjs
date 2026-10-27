import { spawn as defaultSpawn } from "node:child_process";

export function waitForExit(child, failureMessage = (code) => `command failed: ${code}`) {
  let errorOutput = "";
  child.stderr?.on("data", (chunk) => {
    errorOutput += chunk;
  });
  return new Promise((resolve, reject) => {
    child.on("error", reject);
    child.on("close", (code) => {
      if (code) reject(new Error(errorOutput || failureMessage(code)));
      else resolve();
    });
  });
}

export function run(command, args, options = {}, deps = {}) {
  const spawn = deps.spawn ?? defaultSpawn;
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, options);
    let output = "";
    child.stdout?.on("data", (chunk) => {
      output += chunk;
    });
    waitForExit(child).then(() => resolve(output), reject);
  });
}
