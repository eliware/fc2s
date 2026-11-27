import { mockEffects } from "../../../test-fixtures/mock-effects.mjs";

await mockEffects();
const cleanupPartialFile = (await import("../../../src/files/transfer/cleanup.mjs")).default;

test("cleanupPartialFile removes the failed download", async () => {
  let received;
  await cleanupPartialFile("download.zip", async (...args) => {
    received = args;
  });
  expect(received).toEqual(["download.zip", { force: true }]);
});
