import { mockEffects } from "../../test-fixtures/mock-effects.mjs";

await mockEffects();
const cleanupProcess = (await import("../../src/process/cleanup.mjs")).default;

test("cleanup removes work and staging directories after archiving", async () => {
  const removed = [];
  await cleanupProcess("work", "staging", true, async (target) => removed.push(target));
  expect(removed).toEqual(["work", "staging"]);
});

test("cleanup reports failures from both cleanup steps", async () => {
  const removed = [];
  const rm = async (target) => {
    removed.push(target);
    throw new Error(`${target} cleanup failed`);
  };
  try {
    await cleanupProcess("work", "staging", true, rm);
    throw new Error("Expected cleanup to fail");
  } catch (error) {
    expect(error).toBeInstanceOf(AggregateError);
    expect(error.errors.map((item) => item.message)).toEqual([
      "work cleanup failed",
      "staging cleanup failed",
    ]);
    expect(error.cause).toBe(error.errors[0]);
  }
  expect(removed).toEqual(["work", "staging"]);
});

test("cleanup rethrows a single cleanup failure", async () => {
  await expect(
    cleanupProcess("work", "staging", false, async () => {
      throw new Error("work cleanup failed");
    }),
  ).rejects.toThrow("work cleanup failed");
});

test("cleanup reports operation and cleanup failures together", async () => {
  const operationError = new Error("import failed");
  try {
    await cleanupProcess(
      "work",
      "staging",
      false,
      async () => {
        throw new Error("cleanup failed");
      },
      operationError,
    );
    throw new Error("Expected cleanup to fail");
  } catch (error) {
    expect(error).toBeInstanceOf(AggregateError);
    expect(error.errors).toHaveLength(2);
    expect(error.errors[0]).toBe(operationError);
    expect(error.errors[1].message).toBe("cleanup failed");
    expect(error.cause).toBe(operationError);
  }
});

test("cleanup preserves an operation error when cleanup succeeds", async () => {
  const operationError = new Error("import failed");
  await expect(
    cleanupProcess("work", "staging", false, async () => {}, operationError),
  ).rejects.toBe(operationError);
});
