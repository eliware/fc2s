import path from "node:path";
import {
  makeDirectory,
  mockEffects,
  putFile,
  removeTree,
} from "../../test-fixtures/mock-effects.mjs";

await mockEffects();
const { defaultDependencies } = await import("../../src/process/dependencies.mjs");
const { processDate } = await import("../../src/process.mjs");

test("default dependency container is replaceable for isolated runs", async () => {
  const root = makeDirectory("fc2s-process-");
  const original = { ...defaultDependencies };
  Object.assign(defaultDependencies, {
    config: () => ({ driver: "mysql", prefix: "P_", exportDir: root }),
    tempDir: async () => "/tmp/work",
    mkdir: async () => {},
    download: async () => {},
    extract: async () => {},
    schema: async () => [],
    db: async () => ({ query: async () => {}, end: async () => {} }),
    dumpTable: async () => {},
    tarGz: async (output) => putFile(output, "archive contents"),
    stat: async () => ({ size: 1 }),
    rm: async () => {},
  });
  try {
    await expect(processDate("2025-01-02", undefined, undefined)).resolves.toBe(
      path.join(root, "P_2025_01_02.sql.tar.gz"),
    );
  } finally {
    Object.assign(defaultDependencies, original);
    removeTree(root);
  }
});
