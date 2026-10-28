import {
  fileExists,
  getFile,
  makeDirectory,
  mockEffects,
  removeTree,
  setZipEntries,
} from "../../test-fixtures/mock-effects.mjs";

await mockEffects();
const { extract } = await import("../../src/files/extractor.mjs");
const { extract: extractThroughFacade } = await import("../../src/files.mjs");

test("extract writes files and directories from ZIP entries", async () => {
  const root = makeDirectory("extract");
  const archive = {
    getEntries: () => [
      { entryName: "nested/", isDirectory: true, getData: () => Buffer.alloc(0) },
      { entryName: "nested/file.txt", isDirectory: false, getData: () => Buffer.from("x") },
    ],
  };
  await extract("archive.zip", `${root}/out`, {
    AdmZip: class {
      getEntries() {
        return archive.getEntries();
      }
    },
  });
  expect(getFile(`${root}/out/nested/file.txt`, "utf8")).toBe("x");
  removeTree(root);
});

test("extract rejects unsafe ZIP paths", async () => {
  const root = makeDirectory("unsafe-zip");
  const unsafe = {
    entryName: "../escape.txt",
    isDirectory: false,
    getData: () => Buffer.from("x"),
  };
  await expect(
    extractThroughFacade("archive.zip", `${root}/out`, {
      AdmZip: class {
        getEntries() {
          return [unsafe];
        }
      },
    }),
  ).rejects.toThrow("Unsafe ZIP path");
  expect(fileExists(`${root}/escape.txt`)).toBe(false);
  removeTree(root);
});

test("extract uses the default ZIP reader", async () => {
  const root = makeDirectory("default-zip");
  setZipEntries([{ entryName: "file.txt", isDirectory: false, getData: () => Buffer.from("zip") }]);
  await extract("archive.zip", `${root}/out`);
  expect(getFile(`${root}/out/file.txt`, "utf8")).toBe("zip");
  removeTree(root);
});
