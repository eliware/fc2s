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
  await expect(processDatasets("latest", {}, { availableDates: async () => [] })).rejects.toThrow(
    "No FAA dates",
  );
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
  expect(removed).toEqual([
    path.join(root, "P_2025_01_02"),
    "/tmp/work",
    path.join(root, "P_2025_01_02"),
  ]);
  removeTree(root);
});

test("SQLite processing writes the SQLite suffix and cleans its working directory", async () => {
  const root = makeDirectory("process-sqlite");
  const exportDir = path.join(root, "exports");
  const input = path.join(root, "TEST.csv");
  putFile(input, "ID,NAME\n001,Airport\n");
  const dependencies = {
    config: () => ({ driver: "sqlite", prefix: "P_", exportDir }),
    tempDir: async () => makeDirectory("process-sqlite-work"),
    download: async () => {},
    extract: async () => {},
    schema: async () => [{ table: "TEST", csv: input, columns: [] }],
    importSqlite: async (file) => putFile(file, "SQLite database"),
    gzipFile: async (inputFile, output) => putFile(output, getFile(inputFile)),
    stat: async (file) => fileInfo(file),
  };

  const archive = await processDate("2025-01-02", {}, dependencies);
  expect(archive).toBe(path.join(exportDir, "P_2025_01_02.sqlite.gz"));
  expect(getFile(archive, "utf8")).toBe("SQLite database");
  expect(fileExists(path.join(exportDir, "P_2025_01_02"))).toBe(false);
  removeTree(root);
});

test("processDate preserves dump directory when archive fails", async () => {
  const root = makeDirectory("fc2s-process-");
  const removed = [];
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
  removeTree(root);
});

test("process applies default arguments with injected date processing", async () => {
  const calls = [];
  await expect(
    processDatasets(undefined, undefined, {
      availableDates: async () => ["2025-03-01"],
      processDate: async (date) => {
        calls.push(date);
        return date;
      },
    }),
  ).resolves.toEqual(["2025-03-01"]);
  expect(calls).toEqual(["2025-03-01"]);
});

test("processDate applies default overrides with injected dependencies", async () => {
  const root = makeDirectory("fc2s-process-");
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
    stat: async () => ({ size: 1 }),
    rm: async () => {},
  };
  await expect(processDate("2025-01-02", undefined, dependencies)).resolves.toBe(
    path.join(root, "P_2025_01_02.sql.tar.gz"),
  );
  removeTree(root);
});

test("processDate rejects empty archives and still cleans work", async () => {
  const root = makeDirectory("fc2s-process-");
  const removed = [];
  const dependencies = {
    config: () => cfg(root),
    tempDir: async () => "/tmp/work",
    mkdir: async () => {},
    download: async () => {},
    extract: async () => {},
    schema: async () => [],
    db: async () => ({ query: async () => {}, end: async () => {} }),
    stat: async () => ({ size: 0 }),
    rm: async (target) => removed.push(target),
    tarGz: async () => {},
  };
  await expect(processDate("2025-01-02", {}, dependencies)).rejects.toThrow("Empty archive");
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
