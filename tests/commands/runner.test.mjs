import { EventEmitter } from "node:events";
import { mockEffects } from "../../test-fixtures/mock-effects.mjs";

await mockEffects();
const { run } = await import("../../src/commands/runner.mjs");

function child({ output = "", error = "", code = 0 } = {}) {
  const process = new EventEmitter();
  process.stdout = new EventEmitter();
  process.stderr = new EventEmitter();
  queueMicrotask(() => {
    if (output) process.stdout.emit("data", output);
    if (error) process.stderr.emit("data", error);
    process.emit("close", code);
  });
  return process;
}

test("run captures command output and reports injected failures", async () => {
  await expect(run("x", [], {}, { spawn: () => child({ output: "ok" }) })).resolves.toBe("ok");
  await expect(run("x", [], {}, { spawn: () => child({ error: "bad", code: 2 }) })).rejects.toThrow(
    "bad",
  );
  const failing = new EventEmitter();
  await expect(
    run(
      "x",
      [],
      {},
      {
        spawn: () => {
          queueMicrotask(() => failing.emit("error", new Error("spawn failed")));
          return failing;
        },
      },
    ),
  ).rejects.toThrow("spawn failed");
});

test("run uses a fallback command error when stderr is empty", async () => {
  await expect(run("x", [], {}, { spawn: () => child({ code: 2 }) })).rejects.toThrow(
    "command failed: 2",
  );
});

test("run handles children without output streams", async () => {
  const process = new EventEmitter();
  queueMicrotask(() => process.emit("close", 0));
  await expect(run("x", [], {}, { spawn: () => process })).resolves.toBe("");
});

test("run uses the default spawn implementation", async () => {
  await expect(run("fake-output", [])).resolves.toBe("ok");
});
