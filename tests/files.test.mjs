import {
  fileInfo,
  fileExists,
  getFile,
  makeDirectory,
  mockEffects,
  removeTree,
  setZipEntries,
} from "../test-fixtures/mock-effects.mjs";

await mockEffects();
const { download, extract, tempDir } = await import("../src/files.mjs");

test("tempDir creates unique in-memory directories", async () => {
  const first = await tempDir();
  const second = await tempDir();
  expect(first).not.toBe(second);
  expect(fileInfo(first).isDirectory()).toBe(true);
  expect(fileInfo(second).isDirectory()).toBe(true);
});

test("extract writes files and directory entries from ZIP entries", async () => {
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

test("download rejects HTTP errors", async () => {
  const oldFetch = globalThis.fetch;
  globalThis.fetch = async () => ({ ok: false, status: 503, headers: [] });
  try {
    await expect(download("https://localhost/data", "/tmp/x")).rejects.toThrow("Download HTTP 503");
  } finally {
    globalThis.fetch = oldFetch;
  }
});

test("download writes a successful local response", async () => {
  const oldFetch = globalThis.fetch;
  globalThis.fetch = async () => ({
    ok: true,
    status: 200,
    headers: new Headers(),
    arrayBuffer: async () => Uint8Array.from([1, 2]).buffer,
  });
  try {
    await download("https://localhost/data", "/tmp/data");
    expect(getFile("/tmp/data")).toEqual(Buffer.from([1, 2]));
  } finally {
    globalThis.fetch = oldFetch;
  }
});

test("extract rejects unsafe ZIP paths", async () => {
  const root = makeDirectory("unsafe-zip");
  const unsafe = {
    entryName: "../escape.txt",
    isDirectory: false,
    getData: () => Buffer.from("x"),
  };
  await expect(
    extract("archive.zip", `${root}/out`, {
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

test("extract uses the default mocked ZIP reader", async () => {
  const root = makeDirectory("default-zip");
  setZipEntries([{ entryName: "file.txt", isDirectory: false, getData: () => Buffer.from("zip") }]);
  await extract("archive.zip", `${root}/out`);
  expect(getFile(`${root}/out/file.txt`, "utf8")).toBe("zip");
  removeTree(root);
});
