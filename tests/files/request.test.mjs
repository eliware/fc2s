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
