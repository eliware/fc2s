import { fileInfo, mockEffects } from "../../test-fixtures/mock-effects.mjs";

await mockEffects();
const { tempDir } = await import("../../src/files/temp-directory.mjs");

test("tempDir creates unique in-memory directories", async () => {
  const first = await tempDir();
  const second = await tempDir();
  expect(first).not.toBe(second);
  expect(fileInfo(first).isDirectory()).toBe(true);
  expect(fileInfo(second).isDirectory()).toBe(true);
});
