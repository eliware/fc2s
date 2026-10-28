import { mockEffects } from "../../test-fixtures/mock-effects.mjs";
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
  const exportDir = path.resolve("/workspace/exports");
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
    tarGz: async (...args) => calls.push(["tarGz", ...args]),
    stat: async (file) => ({ size: file.endsWith("NASR.sql.tar.gz") ? 10 : 0 }),
  });
  expect(result).toBe(path.join(exportDir, "NASR.sql.tar.gz"));
  expect(calls).toEqual([
    ["mkdir", exportDir, { recursive: true }],
    ["rm", path.join(exportDir, "NASR"), { recursive: true, force: true }],
    ["mkdir", path.join(exportDir, "NASR"), { recursive: true }],
    ["listTables", config, "NASR"],
    ["dumpTable", config, "NASR", "APT", path.join(exportDir, "NASR", "APT.sql")],
    ["dumpTable", config, "NASR", "NAV", path.join(exportDir, "NASR", "NAV.sql")],
    ["tarGz", path.join(exportDir, "NASR.sql.tar.gz"), path.join(exportDir, "NASR")],
    ["rm", path.join(exportDir, "NASR"), { recursive: true, force: true }],
  ]);
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
  await expect(
    dumpDatabase("NASR", {
      config: () => ({ exportDir: path.resolve("/workspace/exports") }),
      mkdir: async () => {},
      rm: async (target) => removed.push(target),
      listTables: async () => [],
      tarGz: async () => {},
      stat: async () => ({ size: 0 }),
    }),
  ).rejects.toThrow("Empty archive");
  expect(removed).toEqual([
    path.resolve("/workspace/exports/NASR"),
    path.resolve("/workspace/exports/NASR"),
  ]);
});
