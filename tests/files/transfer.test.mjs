import { getFile, mockEffects } from "../../test-fixtures/mock-effects.mjs";

await mockEffects();
const { download } = await import("../../src/files/transfer.mjs");

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
