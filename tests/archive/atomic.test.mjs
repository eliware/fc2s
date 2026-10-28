import {
  fileExists,
  getFile,
  makeDirectory,
  mockEffects,
  putFile,
  removeTree,
} from "../../test-fixtures/mock-effects.mjs";

await mockEffects();
const { atomicArchive } = await import("../../src/archive/atomic.mjs");

test("atomicArchive replaces an existing archive after creating a nonempty replacement", async () => {
  const root = makeDirectory("atomic-archive");
  const output = `${root}/export.tar.gz`;
  putFile(output, "previous archive");
  await atomicArchive(output, async (temporary) => putFile(temporary, "new archive"));
  expect(getFile(output, "utf8")).toBe("new archive");
  removeTree(root);
});

test("atomicArchive preserves an existing archive when creation fails", async () => {
  const root = makeDirectory("atomic-archive-failure");
  const output = `${root}/export.tar.gz`;
  putFile(output, "previous archive");
  await expect(
    atomicArchive(output, async (temporary) => {
      putFile(temporary, "partial archive");
      throw new Error("archive failed");
    }),
  ).rejects.toThrow("archive failed");
  expect(getFile(output, "utf8")).toBe("previous archive");
  removeTree(root);
});

test("atomicArchive rejects an empty archive without replacing the existing file", async () => {
  const root = makeDirectory("atomic-archive-empty");
  const output = `${root}/export.tar.gz`;
  putFile(output, "previous archive");
  await expect(atomicArchive(output, async (temporary) => putFile(temporary, ""))).rejects.toThrow(
    "Empty archive",
  );
  expect(getFile(output, "utf8")).toBe("previous archive");
  removeTree(root);
});

test("atomicArchive reports cleanup failure after installing the complete archive", async () => {
  const root = makeDirectory("atomic-archive-cleanup");
  const output = `${root}/export.tar.gz`;
  await expect(
    atomicArchive(output, async (temporary) => putFile(temporary, "complete archive"), {
      rm: async () => {
        throw new Error("temporary cleanup failed");
      },
    }),
  ).rejects.toThrow("temporary cleanup failed");
  expect(fileExists(output)).toBe(true);
  expect(getFile(output, "utf8")).toBe("complete archive");
  removeTree(root);
});

test("atomicArchive keeps the archive failure when temporary cleanup also fails", async () => {
  const root = makeDirectory("atomic-archive-double-failure");
  const output = `${root}/export.tar.gz`;
  await expect(
    atomicArchive(
      output,
      async () => {
        throw new Error("archive failed");
      },
      {
        rm: async () => {
          throw new Error("temporary cleanup failed");
        },
      },
    ),
  ).rejects.toThrow("archive failed");
  removeTree(root);
});
