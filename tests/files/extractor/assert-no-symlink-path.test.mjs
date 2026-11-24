import {
  makeDirectory,
  makeSymlink,
  mockEffects,
  putFile,
} from "../../../test-fixtures/mock-effects.mjs";

await mockEffects();
const assertNoSymlinkPath = (
  await import("../../../src/files/extractor/assert-no-symlink-path.mjs")
).default;

test("assertNoSymlinkPath accepts the root and safe paths", async () => {
  const root = makeDirectory("safe-path");
  putFile(`${root}/nested/file.txt`, "safe");
  await expect(assertNoSymlinkPath(root, root)).resolves.toBeUndefined();
  await expect(assertNoSymlinkPath(root, `${root}/nested/file.txt`)).resolves.toBeUndefined();
});

test("assertNoSymlinkPath accepts missing paths", async () => {
  const root = makeDirectory("missing-path");
  await expect(assertNoSymlinkPath(root, `${root}/missing/file.txt`)).resolves.toBeUndefined();
});

test("assertNoSymlinkPath rejects a symbolic link", async () => {
  const root = makeDirectory("symlink-path");
  makeSymlink(`${root}/target`, `${root}/link`);
  await expect(assertNoSymlinkPath(root, `${root}/link/file.txt`)).rejects.toThrow(
    "Unsafe ZIP symlink path",
  );
});
