import { fileInfo, getFile, mockEffects } from "../test-fixtures/mock-effects.mjs";

await mockEffects();
const [facade, extractor, transfer] = await Promise.all([
  import("../src/files.mjs"),
  import("../src/files/extractor.mjs"),
  import("../src/files/transfer.mjs"),
]);

test("files facade delegates transfer and extraction operations", async () => {
  expect(facade.download).not.toBe(transfer.download);
  expect(facade.tempDir).not.toBe(transfer.tempDir);
  expect(facade.extract).not.toBe(extractor.extract);
  expect(typeof facade.mkdir).toBe("function");
  expect(typeof facade.readFile).toBe("function");
  expect(typeof facade.rm).toBe("function");

  const directory = await facade.tempDir();
  expect(fileInfo(directory).isDirectory()).toBe(true);

  const oldFetch = globalThis.fetch;
  globalThis.fetch = async () => ({
    ok: true,
    status: 200,
    headers: new Headers(),
    arrayBuffer: async () => Uint8Array.from([1]).buffer,
  });
  try {
    await facade.download("https://localhost/data", "/tmp/facade-data");
    expect(getFile("/tmp/facade-data")).toEqual(Buffer.from([1]));
  } finally {
    globalThis.fetch = oldFetch;
  }

  await facade.extract("archive.zip", "/tmp/facade-extract", {
    AdmZip: class {
      getEntries() {
        return [{ entryName: "file.txt", isDirectory: false, getData: () => Buffer.from("ok") }];
      }
    },
  });
  expect(getFile("/tmp/facade-extract/file.txt", "utf8")).toBe("ok");
});
