import { jest } from "@jest/globals";
import { fileExists, getFile, mockEffects } from "../../test-fixtures/mock-effects.mjs";

await mockEffects();
const { download } = await import("../../src/files/transfer.mjs");
const facade = await import("../../src/files.mjs");

test("download rejects HTTP errors", async () => {
  const oldFetch = globalThis.fetch;
  globalThis.fetch = async () => ({ ok: false, status: 503, headers: [] });
  try {
    await expect(facade.download("https://localhost/data", "/tmp/x")).rejects.toThrow(
      "Download HTTP 503",
    );
  } finally {
    globalThis.fetch = oldFetch;
  }
});

test("download writes a successful local response", async () => {
  const oldFetch = globalThis.fetch;
  const body = new ReadableStream({
    start(controller) {
      controller.enqueue(Uint8Array.from([1, 2]));
      controller.close();
    },
  });
  globalThis.fetch = async () => ({
    ok: true,
    status: 200,
    headers: new Headers(),
    body,
    arrayBuffer: async () => {
      throw new Error("Downloader should stream the response body");
    },
  });
  try {
    await download("https://localhost/data", "/tmp/data");
    expect(getFile("/tmp/data")).toEqual(Buffer.from([1, 2]));
  } finally {
    globalThis.fetch = oldFetch;
  }
});

test("download rejects when the response stream fails", async () => {
  const oldFetch = globalThis.fetch;
  globalThis.fetch = async () => ({
    ok: true,
    status: 200,
    headers: new Headers(),
    body: new ReadableStream({
      start(controller) {
        controller.error(new Error("network interrupted"));
      },
    }),
  });
  try {
    await expect(download("https://localhost/data", "/tmp/interrupted")).rejects.toThrow(
      "network interrupted",
    );
    expect(fileExists("/tmp/interrupted")).toBe(false);
  } finally {
    globalThis.fetch = oldFetch;
  }
});

test("verbose download logs omit URL query credentials", async () => {
  const oldFetch = globalThis.fetch;
  const oldVerbose = process.env.FC2S_VERBOSE;
  const error = jest.spyOn(console, "error").mockImplementation(() => {});
  process.env.FC2S_VERBOSE = "1";
  globalThis.fetch = async () => ({
    ok: true,
    status: 200,
    headers: new Headers(),
    body: new ReadableStream({
      start(controller) {
        controller.close();
      },
    }),
  });
  try {
    await download("https://example.test/data?token=secret", "/tmp/private-url");
    expect(error.mock.calls.flat().join(" ")).not.toContain("secret");
    expect(error.mock.calls.flat().join(" ")).not.toContain("example.test");
  } finally {
    globalThis.fetch = oldFetch;
    if (oldVerbose === undefined) delete process.env.FC2S_VERBOSE;
    else process.env.FC2S_VERBOSE = oldVerbose;
    error.mockRestore();
  }
});
