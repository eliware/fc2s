import { makeDirectory, mockEffects, putFile, removeTree } from "../test-fixtures/mock-effects.mjs";

await mockEffects();
const { gzipFile, tarGz } = await import("../src/archive.mjs");

test("archive facade delegates compression and tar operations", async () => {
  const { EventEmitter } = await import("node:events");
  const root = makeDirectory("archive-facade");
  putFile(`${root}/input`, "payload");
  await gzipFile(`${root}/input`, `${root}/output.gz`);
  const child = new EventEmitter();
  child.stderr = new EventEmitter();
  const archive = tarGz(`${root}/output.tar.gz`, root, undefined, { spawn: () => child });
  child.emit("close", 0);
  await archive;
  expect(gzipFile).toEqual(expect.any(Function));
  expect(tarGz).toEqual(expect.any(Function));
  removeTree(root);
});
