import runProcess from "../src/process/current.mjs";
try {
  console.log((await runProcess("all")).join("\n"));
} catch (e) {
  console.error(e.message);
  globalThis.process.exitCode = 1;
}
