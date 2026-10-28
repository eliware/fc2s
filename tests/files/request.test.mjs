import { jest } from "@jest/globals";
import { mockEffects } from "../../test-fixtures/mock-effects.mjs";

await mockEffects();
const { request } = await import("../../src/files/request.mjs");

test("request returns a successful HTTP response", async () => {
  const oldFetch = globalThis.fetch;
  const response = { ok: true, status: 200 };
  globalThis.fetch = async () => response;
  try {
    await expect(request("https://localhost/data")).resolves.toBe(response);
  } finally {
    globalThis.fetch = oldFetch;
  }
});

test("request rejects unsuccessful HTTP responses", async () => {
  const oldFetch = globalThis.fetch;
  globalThis.fetch = async () => ({ ok: false, status: 503, headers: [] });
  try {
    await expect(request("https://localhost/data")).rejects.toThrow("Download HTTP 503");
  } finally {
    globalThis.fetch = oldFetch;
  }
});

test("verbose request logs omit URL query credentials", async () => {
  const oldFetch = globalThis.fetch;
  const oldVerbose = process.env.FC2S_VERBOSE;
  const error = jest.spyOn(console, "error").mockImplementation(() => {});
  process.env.FC2S_VERBOSE = "1";
  globalThis.fetch = async () => ({ ok: true, status: 200, headers: [] });
  try {
    await request("https://example.test/data?token=secret");
    expect(error).toHaveBeenCalledTimes(1);
    expect(error.mock.calls[0].join(" ")).not.toContain("secret");
    expect(error.mock.calls[0].join(" ")).not.toContain("example.test");
  } finally {
    globalThis.fetch = oldFetch;
    if (oldVerbose === undefined) delete process.env.FC2S_VERBOSE;
    else process.env.FC2S_VERBOSE = oldVerbose;
    error.mockRestore();
  }
});
