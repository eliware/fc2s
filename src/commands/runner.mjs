import { spawn as defaultSpawn } from "node:child_process";
import waitForExit from "./wait-for-exit.mjs";

export default function run(command, args, options = {}, deps = {}) {
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
