import runProcess from "../src/process/current.mjs";

try {
  console.log((await runProcess("current")).join("\n"));
} catch (e) {
  console.error(e.message);
  globalThis.process.exitCode = 1;
}
