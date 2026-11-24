import path from "node:path";
import resolveEntry from "../../../src/files/extractor/resolve-entry.mjs";

test("resolveEntry returns paths inside the extraction root", () => {
  expect(resolveEntry("/workspace/out", "nested/file.txt")).toBe(
    path.join(path.resolve("/workspace/out"), "nested", "file.txt"),
  );
  expect(resolveEntry("/workspace/out", ".")).toBe(path.resolve("/workspace/out"));
});

test.each(["../escape.txt", "/outside.txt"])("resolveEntry rejects %s", (entry) => {
  expect(() => resolveEntry("/workspace/out", entry)).toThrow("Unsafe ZIP path");
});
