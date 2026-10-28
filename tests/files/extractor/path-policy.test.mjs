import { mockEffects } from "../../../test-fixtures/mock-effects.mjs";
import path from "node:path";

await mockEffects();
const { resolveEntry } = await import("../../../src/files/extractor/path-policy.mjs");

test("path policy resolves entries beneath the extraction root", () => {
  expect(resolveEntry("/workspace/out", "nested/file.txt")).toBe(
    path.join(path.resolve("/workspace/out"), "nested", "file.txt"),
  );
});

test("path policy accepts the extraction root", () => {
  expect(resolveEntry("/workspace/out", ".")).toBe(path.resolve("/workspace/out"));
});

test.each(["../escape.txt", "/outside.txt"])("path policy rejects %s", (entryName) => {
  expect(() => resolveEntry("/workspace/out", entryName)).toThrow("Unsafe ZIP path");
});
