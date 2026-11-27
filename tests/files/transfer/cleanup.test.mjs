import { mockEffects } from "../../../test-fixtures/mock-effects.mjs";

await mockEffects();
const cleanupPartialFile = (await import("../../../src/files/transfer/cleanup.mjs")).default;

test("cleanupPartialFile removes the failed download", async () => {
  const operationError = new Error("network interrupted");
  let received;
  await cleanupPartialFile("download.zip", operationError, async (...args) => {
    received = args;
  });
  expect(received).toEqual(["download.zip", { force: true }]);
});

test("cleanupPartialFile preserves the download error when cleanup fails", async () => {
  const operationError = new Error("network interrupted");
  const cleanupError = new Error("permission denied");
  await expect(
    cleanupPartialFile("download.zip", operationError, async () => {
      throw cleanupError;
    }),
  ).rejects.toMatchObject({
    name: "AggregateError",
    errors: [operationError, cleanupError],
    cause: operationError,
  });
});
