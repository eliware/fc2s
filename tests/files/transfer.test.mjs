import { fileInfo, getFile, mockEffects } from "../../test-fixtures/mock-effects.mjs";

await mockEffects();
const { download, tempDir } = await import("../../src/files/transfer.mjs");

test("tempDir creates unique in-memory directories", async () => {
  const first = await tempDir();
  const second = await tempDir();
  expect(first).not.toBe(second);
  expect(fileInfo(first).isDirectory()).toBe(true);
  expect(fileInfo(second).isDirectory()).toBe(true);
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
