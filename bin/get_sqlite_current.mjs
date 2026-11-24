import runProcess from "../src/process/current.mjs";

try {
  console.log((await runProcess("current", { driver: "sqlite" })).join("\n"));
} catch (error) {
  console.error(error.stack || error.message);
  globalThis.process.exitCode = 1;
}
