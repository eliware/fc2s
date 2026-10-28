import { mockEffects } from "../../../test-fixtures/mock-effects.mjs";

await mockEffects();
const { resolveEntry } = await import("../../../src/files/extractor/path-policy.mjs");

test("path policy resolves entries beneath the extraction root", () => {
  expect(resolveEntry("/workspace/out", "nested/file.txt")).toBe("/workspace/out/nested/file.txt");
});

test.each(["../escape.txt", "/outside.txt"])("path policy rejects %s", (entryName) => {
  expect(() => resolveEntry("/workspace/out", entryName)).toThrow("Unsafe ZIP path");
});
