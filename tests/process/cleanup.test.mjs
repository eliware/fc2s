import { mockEffects } from "../../test-fixtures/mock-effects.mjs";

await mockEffects();
const { cleanupProcess } = await import("../../src/process/cleanup.mjs");

test("cleanup removes work and staging directories after archiving", async () => {
  const removed = [];
  await cleanupProcess("work", "staging", true, async (target) => removed.push(target));
  expect(removed).toEqual(["work", "staging"]);
});

test("cleanup attempts staging removal when work cleanup fails", async () => {
  const removed = [];
  const rm = async (target) => {
    removed.push(target);
    throw new Error(`${target} cleanup failed`);
  };
  await expect(cleanupProcess("work", "staging", true, rm)).rejects.toThrow("work cleanup failed");
  expect(removed).toEqual(["work", "staging"]);
});

test("cleanup preserves the operation error over cleanup failures", async () => {
  const operationError = new Error("import failed");
  await expect(
    cleanupProcess(
      "work",
      "staging",
      false,
      async () => {
        throw new Error("cleanup failed");
      },
      operationError,
    ),
  ).rejects.toBe(operationError);
});
