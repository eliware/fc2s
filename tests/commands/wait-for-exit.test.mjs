import { EventEmitter } from "node:events";
import waitForExit from "../../src/commands/wait-for-exit.mjs";

function child(code, errorOutput = "") {
  const process = new EventEmitter();
  process.stderr = new EventEmitter();
  queueMicrotask(() => {
    if (errorOutput) process.stderr.emit("data", errorOutput);
    process.emit("close", code);
  });
  return process;
}

test("waitForExit resolves successful processes", async () => {
  await expect(waitForExit(child(0))).resolves.toBeUndefined();
});

test("waitForExit reports stderr or a fallback error", async () => {
  await expect(waitForExit(child(2, "stderr"))).rejects.toThrow("stderr");
  await expect(waitForExit(child(3), (code) => `failed: ${code}`)).rejects.toThrow("failed: 3");
});

test("waitForExit forwards spawn errors", async () => {
  const process = new EventEmitter();
  process.stderr = new EventEmitter();
  queueMicrotask(() => process.emit("error", new Error("spawn failed")));
  await expect(waitForExit(process)).rejects.toThrow("spawn failed");
});
