import {
  fileInfo,
  getFile,
  makeDirectory,
  mockEffects,
  putFile,
  removeTree,
} from "../../test-fixtures/mock-effects.mjs";
import path from "node:path";

await mockEffects();
const { dumpDatabase } = await import("../../src/bin/dump-db.mjs");
const { runDump } = await import("../../bin/dump_db.mjs");

test("dumpDatabase rejects a missing or unsafe name", async () => {
  await expect(dumpDatabase("")).rejects.toThrow("Usage: node bin/dump_db.mjs <db_name>");
  await expect(dumpDatabase("bad-name")).rejects.toThrow("Usage: node bin/dump_db.mjs <db_name>");
});

test("dump_db launcher reports usage when the database name is missing", async () => {
  const originalExitCode = process.exitCode;
  const errors = [];
  try {
    await expect(
      runDump(undefined, { error: (message) => errors.push(message) }),
    ).resolves.toBeUndefined();
    expect(errors[0]).toContain("Usage: node bin/dump_db.mjs <db_name>");
    expect(process.exitCode).toBe(1);
  } finally {
    process.exitCode = originalExitCode;
  }
});

test("dumpDatabase enumerates, dumps, archives, and cleans up", async () => {
  const calls = [];
  const exportDir = makeDirectory("dump-db-exports");
  const config = { exportDir };
  const result = await dumpDatabase("NASR", {
    config: () => config,
    mkdir: async (...args) => calls.push(["mkdir", ...args]),
    rm: async (...args) => calls.push(["rm", ...args]),
    listTables: async (receivedConfig, database) => {
      calls.push(["listTables", receivedConfig, database]);
      return ["APT", "NAV"];
    },
    dumpTable: async (...args) => calls.push(["dumpTable", ...args]),
    tarGz: async (...args) => {
      calls.push(["tarGz", ...args]);
      putFile(args[0], "archive contents");
    },
    stat: async (file) => ({ size: file.endsWith("NASR.sql.tar.gz") ? 10 : 0 }),
  });
  expect(result).toBe(path.join(exportDir, "NASR.sql.tar.gz"));
  expect(calls.slice(0, 6)).toEqual([
    ["mkdir", exportDir, { recursive: true }],
    ["rm", path.join(exportDir, "NASR"), { recursive: true, force: true }],
    ["mkdir", path.join(exportDir, "NASR"), { recursive: true }],
    ["listTables", config, "NASR"],
    ["dumpTable", config, "NASR", "APT", path.join(exportDir, "NASR", "APT.sql")],
    ["dumpTable", config, "NASR", "NAV", path.join(exportDir, "NASR", "NAV.sql")],
  ]);
  expect(calls[6][0]).toBe("tarGz");
  expect(path.basename(calls[6][1])).toBe("NASR.sql.tar.gz");
  expect(path.dirname(path.dirname(calls[6][1]))).toBe(exportDir);
  expect(calls[6][2]).toBe(path.join(exportDir, "NASR"));
  expect(calls[7]).toEqual(["rm", path.join(exportDir, "NASR"), { recursive: true, force: true }]);
  expect(getFile(result, "utf8")).toBe("archive contents");
  removeTree(exportDir);
});

test("dumpDatabase rejects unsafe table names and removes the staging directory", async () => {
  const removed = [];
  await expect(
    dumpDatabase("NASR", {
      config: () => ({ exportDir: path.resolve("/workspace/exports") }),
      mkdir: async () => {},
      rm: async (target) => removed.push(target),
      listTables: async () => ["bad-name"],
    }),
  ).rejects.toThrow("Unsafe table name: bad-name");
  expect(removed).toEqual([
    path.resolve("/workspace/exports/NASR"),
    path.resolve("/workspace/exports/NASR"),
  ]);
});

test("dumpDatabase rejects empty archives and removes staging", async () => {
  const removed = [];
  const exportDir = makeDirectory("dump-db-empty");
  await expect(
    dumpDatabase("NASR", {
      config: () => ({ exportDir }),
      mkdir: async () => {},
      rm: async (target) => removed.push(target),
      listTables: async () => [],
      tarGz: async () => {},
      stat: async () => ({ size: 0 }),
    }),
  ).rejects.toThrow("Empty archive");
  expect(removed).toEqual([path.join(exportDir, "NASR"), path.join(exportDir, "NASR")]);
  removeTree(exportDir);
});

test("dumpDatabase preserves an existing archive when tar fails", async () => {
  const exportDir = makeDirectory("dump-db-preserve");
  const archive = path.join(exportDir, "NASR.sql.tar.gz");
  putFile(archive, "previous valid archive");
  await expect(
    dumpDatabase("NASR", {
      config: () => ({ exportDir }),
      mkdir: async () => {},
      rm: async () => {},
      listTables: async () => [],
      tarGz: async (temporary) => {
        putFile(temporary, "partial archive");
        throw new Error("tar failed");
      },
    }),
  ).rejects.toThrow("tar failed");
  expect(getFile(archive, "utf8")).toBe("previous valid archive");
  expect(fileInfo(exportDir).isDirectory()).toBe(true);
  removeTree(exportDir);
});
