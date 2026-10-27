import {
  getFile,
  makeDirectory,
  mockEffects,
  removeTree,
} from "../../../test-fixtures/mock-effects.mjs";

await mockEffects();
const { writeDump } = await import("../../../src/mysql/dump/writer.mjs");

test("writeDump streams child output to the requested file", async () => {
  const stream = {};
  const stdout = {};
  const child = { stdout };
  const calls = [];
  await writeDump(child, "dump.sql", {
    pipeline: async (...args) => calls.push(args),
    createWriteStream: (file) => {
      expect(file).toBe("dump.sql");
      return stream;
    },
  });
  expect(calls).toEqual([[stdout, stream]]);
});

test("writeDump uses the default writer dependencies", async () => {
  const { PassThrough } = await import("node:stream");
  const root = makeDirectory("dump-writer");
  const output = new PassThrough();
  const dumping = writeDump({ stdout: output }, `${root}/dump.sql`);
  output.end("SQL");
  await dumping;
  expect(getFile(`${root}/dump.sql`, "utf8")).toBe("SQL");
  removeTree(root);
});
