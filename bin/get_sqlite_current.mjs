import { process as runProcess } from "../src/process.mjs";

try {
  console.log((await runProcess("current", { driver: "sqlite" })).join("\n"));
} catch (error) {
  console.error(error.stack || error.message);
  globalThis.process.exitCode = 1;
}
