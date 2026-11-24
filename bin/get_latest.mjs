import runProcess from "../src/process/current.mjs";

try {
  console.log((await runProcess("latest")).join("\n"));
} catch (e) {
  console.error(e.message);
  globalThis.process.exitCode = 1;
}
