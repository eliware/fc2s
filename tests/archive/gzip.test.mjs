import {
  fileInfo,
  getFile,
  makeDirectory,
  mockEffects,
  putFile,
  removeTree,
} from "../../test-fixtures/mock-effects.mjs";

await mockEffects();
const { gzipFile } = await import("../../src/archive/gzip.mjs");

test("gzipFile compresses a file and removes partial output after failure", async () => {
  const root = makeDirectory("gzip");
  const input = `${root}/database.sqlite`;
  const output = `${root}/database.sqlite.gz`;
  putFile(input, "sqlite database bytes");
  await gzipFile(input, output);
  expect(getFile(output)).toEqual(expect.any(Buffer));
  await expect(gzipFile(`${root}/missing.sqlite`, output)).rejects.toThrow("gzip failed");
  expect(() => fileInfo(output)).toThrow();
  removeTree(root);
});
