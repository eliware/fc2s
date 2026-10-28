import { fileInfo, mockEffects, removeTree } from "../test-fixtures/mock-effects.mjs";

await mockEffects();
const facade = await import("../src/files.mjs");
const extractor = await import("../src/files/extractor.mjs");
const transfer = await import("../src/files/transfer.mjs");
const tempDirectory = await import("../src/files/temp-directory.mjs");

test("files facade exposes and delegates file operations", async () => {
  expect(facade.download).not.toBe(transfer.download);
  expect(facade.tempDir).not.toBe(tempDirectory.tempDir);
  expect(facade.extract).not.toBe(extractor.extract);
  expect(typeof facade.mkdir).toBe("function");
  expect(typeof facade.readFile).toBe("function");
  expect(typeof facade.rm).toBe("function");

  const directory = await facade.tempDir();
  expect(fileInfo(directory).isDirectory()).toBe(true);
  removeTree(directory);
});
