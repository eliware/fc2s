import path from "node:path";
import {
  fileExists,
  fileInfo,
  getFile,
  makeDirectory,
  mockEffects,
  putFile,
  removeTree,
} from "../test-fixtures/mock-effects.mjs";

await mockEffects();
const {
  process: processDatasets,
  processDate,
  defaultDependencies,
} = await import("../src/process.mjs");

const cfg = (exportDir) => ({
  driver: "mysql",
  host: "h",
  user: "u",
  password: "p",
  port: 3306,
  prefix: "P_",
  exportDir,
});

test("process selects latest, current, and all through injection", async () => {
  const calls = [];
  const dependencies = {
    availableDates: async () => ["2025-03-01", "2025-02-01", "2025-01-01"],
    processDate: async (date) => {
      calls.push(date);
      return date;
    },
  };
  await expect(processDatasets("latest", {}, dependencies)).resolves.toEqual(["2025-03-01"]);
  await expect(processDatasets("current", {}, dependencies)).resolves.toEqual(["2025-02-01"]);
  await expect(processDatasets("all", {}, dependencies)).resolves.toEqual([
    "2025-01-01",
    "2025-02-01",
    "2025-03-01",
  ]);
  expect(calls).toHaveLength(5);
  const noDates = { availableDates: async () => [] };
  await expect(processDatasets("latest", {}, noDates)).rejects.toThrow("No FAA dates");
});

test("processDate orchestrates and cleans successful work", async () => {
  const root = makeDirectory("fc2s-process-");
  const removed = [];
  const connection = { query: async () => {}, end: async () => {} };
  const dependencies = {
    config: () => cfg(root),
    tempDir: async () => "/tmp/work",
    mkdir: async () => {},
    download: async () => {},
    extract: async () => {},
    schema: async () => [{ table: "T", sql: "CREATE" }],
    db: async () => connection,
    dumpTable: async () => {},
    tarGz: async () => {},
    stat: async () => ({ size: 1 }),
    rm: async (target) => removed.push(target),
  };
  await expect(processDate("2025-01-02", {}, dependencies)).resolves.toBe(
    path.join(root, "P_2025_01_02.sql.tar.gz"),
  );
  expect(removed).toHaveLength(3);
  removeTree(root);
});

test("processDate selects SQLite import, archives it, and removes staging", async () => {
  const root = makeDirectory("process-sqlite");
  const exportDir = path.join(root, "exports");
  const input = path.join(root, "TEST.csv");
  const imported = [];
  const compressed = [];
  const dependencies = {
    config: () => ({ driver: "sqlite", prefix: "P_", exportDir }),
    tempDir: async () => makeDirectory("process-sqlite-work"),
    download: async () => {},
    extract: async () => {},
    schema: async () => [{ table: "TEST", csv: input, columns: [] }],
    importSqlite: async (file, tables) => {
      imported.push({ file, tables });
      putFile(file, "SQLite database");
    },
    gzipFile: async (inputFile, output) => {
      compressed.push({ inputFile, output });
      putFile(output, getFile(inputFile));
    },
    stat: async (file) => fileInfo(file),
  };

  const archive = await processDate("2025-01-02", {}, dependencies);
  expect(archive).toBe(path.join(exportDir, "P_2025_01_02.sqlite.gz"));
  expect(imported).toEqual([
    {
      file: path.join(exportDir, "P_2025_01_02", "P_2025_01_02.sqlite"),
      tables: [{ table: "TEST", csv: input, columns: [] }],
    },
  ]);
  expect(compressed).toEqual([
    {
      inputFile: path.join(exportDir, "P_2025_01_02", "P_2025_01_02.sqlite"),
      output: archive,
    },
  ]);
  expect(getFile(archive, "utf8")).toBe("SQLite database");
  expect(fileExists(path.join(exportDir, "P_2025_01_02"))).toBe(false);
  removeTree(root);
});

test("processDate cleans staging after archive and work cleanup failures", async () => {
  const root = makeDirectory("fc2s-process-");
  const removed = [];
  let stagingRemovals = 0;
  const dependencies = {
    config: () => cfg(root),
    tempDir: async () => "/tmp/work",
    mkdir: async () => {},
    download: async () => {},
    extract: async () => {},
    schema: async () => [],
    db: async () => ({ query: async () => {}, end: async () => {} }),
    stat: async () => ({ size: 1 }),
    rm: async (target) => removed.push(target),
    tarGz: async () => {
      throw new Error("archive failed");
    },
  };
  await expect(processDate("2025-01-02", {}, dependencies)).rejects.toThrow("archive failed");
  expect(removed).toEqual([path.join(root, "P_2025_01_02"), "/tmp/work"]);
  removed.length = 0;
  dependencies.tarGz = async () => {};
  dependencies.rm = async (target) => {
    removed.push(target);
    if (target === "/tmp/work") throw new Error("work cleanup failed");
  };
  await expect(processDate("2025-01-02", {}, dependencies)).rejects.toThrow("work cleanup failed");
  expect(removed).toEqual([
    path.join(root, "P_2025_01_02"),
    "/tmp/work",
    path.join(root, "P_2025_01_02"),
  ]);
  removed.length = 0;
  stagingRemovals = 0;
  dependencies.rm = async (target) => {
    removed.push(target);
    if (target === path.join(root, "P_2025_01_02") && ++stagingRemovals === 2) {
      throw new Error("staging cleanup failed");
    }
  };
  await expect(processDate("2025-01-02", {}, dependencies)).rejects.toThrow(
    "staging cleanup failed",
  );
  expect(removed).toEqual([
    path.join(root, "P_2025_01_02"),
    "/tmp/work",
    path.join(root, "P_2025_01_02"),
  ]);
  removeTree(root);
});
test("process applies default arguments with injected date processing", async () => {
  const calls = [];
  const dependencies = {
    availableDates: async () => ["2025-03-01"],
    processDate: async (date) => {
      calls.push(date);
      return date;
    },
  };
  expect(await processDatasets(undefined, undefined, dependencies)).toEqual(["2025-03-01"]);
  expect(calls).toEqual(["2025-03-01"]);
});

test("processDate applies default overrides with injected dependencies", async () => {
  const root = makeDirectory("fc2s-process-");
  let size = 1;
  const removed = [];
  const dependencies = {
    config: () => cfg(root),
    tempDir: async () => "/tmp/work",
    mkdir: async () => {},
    download: async () => {},
    extract: async () => {},
    schema: async () => [],
    db: async () => ({ query: async () => {}, end: async () => {} }),
    dumpTable: async () => {},
    tarGz: async () => {},
    stat: async () => ({ size }),
    rm: async (target) => removed.push(target),
  };
  await expect(processDate("2025-01-02", undefined, dependencies)).resolves.toBe(
    path.join(root, "P_2025_01_02.sql.tar.gz"),
  );
  size = 0;
  removed.length = 0;
  await expect(processDate("2025-01-02", undefined, dependencies)).rejects.toThrow("Empty archive");
  expect(removed).toEqual([path.join(root, "P_2025_01_02"), "/tmp/work"]);
  removeTree(root);
});

test("processDate ends connection and cleans work when SQL fails", async () => {
  const root = makeDirectory("fc2s-process-");
  const removed = [];
  let ended = false;
  const dependencies = {
    config: () => cfg(root),
    tempDir: async () => "/tmp/work",
    mkdir: async () => {},
    download: async () => {},
    extract: async () => {},
    schema: async () => [{ table: "T", sql: "BAD" }],
    db: async () => ({
      query: async () => {
        throw new Error("SQL failed");
      },
      end: async () => {
        ended = true;
      },
    }),
    rm: async (target) => removed.push(target),
  };
  await expect(processDate("2025-01-02", {}, dependencies)).rejects.toThrow("SQL failed");
  expect(ended).toBe(true);
  expect(removed).toEqual([path.join(root, "P_2025_01_02"), "/tmp/work"]);
  removeTree(root);
});

test("default dependency container is fully replaceable for isolated runs", async () => {
  const root = makeDirectory("fc2s-process-");
  const original = { ...defaultDependencies };
  const calls = [];
  Object.assign(defaultDependencies, {
    config: () => cfg(root),
    tempDir: async () => "/tmp/work",
    mkdir: async () => {},
    download: async () => {},
    extract: async () => {},
    schema: async () => [],
    db: async () => ({ query: async () => {}, end: async () => {} }),
    dumpTable: async () => {},
    tarGz: async () => {},
    stat: async () => ({ size: 1 }),
    rm: async () => {},
    availableDates: async () => ["2025-01-02"],
    processDate: async (date) => {
      calls.push(date);
      return date;
    },
  });
  try {
    await expect(processDate("2025-01-02", undefined, undefined)).resolves.toBe(
      path.join(root, "P_2025_01_02.sql.tar.gz"),
    );
    await expect(processDatasets()).resolves.toEqual(["2025-01-02"]);
    expect(calls).toEqual(["2025-01-02"]);
  } finally {
    delete defaultDependencies.processDate;
    Object.assign(defaultDependencies, original);
    removeTree(root);
  }
});

test("process uses injected defaults when processDate is omitted", async () => {
  const root = makeDirectory("fc2s-process-");
  const original = { ...defaultDependencies };
  Object.assign(defaultDependencies, {
    config: () => cfg(root),
    tempDir: async () => "/tmp/work",
    mkdir: async () => {},
    download: async () => {},
    extract: async () => {},
    schema: async () => [],
    db: async () => ({ query: async () => {}, end: async () => {} }),
    dumpTable: async () => {},
    tarGz: async () => {},
    stat: async () => ({ size: 1 }),
    rm: async () => {},
  });
  try {
    await expect(
      processDatasets(
        "latest",
        {},
        {
          availableDates: async () => ["2025-01-02"],
        },
      ),
    ).resolves.toEqual([path.join(root, "P_2025_01_02.sql.tar.gz")]);
  } finally {
    Object.assign(defaultDependencies, original);
    removeTree(root);
  }
});
