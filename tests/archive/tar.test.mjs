import { EventEmitter } from "node:events";
import {
  fileInfo,
  makeDirectory,
  mockEffects,
  putFile,
  removeTree,
} from "../../test-fixtures/mock-effects.mjs";

await mockEffects();
const { tarGz } = await import("../../src/archive/tar.mjs");

test("tarGz creates an archive through the default mocked child process", async () => {
  const root = makeDirectory("archive");
  const directory = `${root}/dump`;
  const archive = `${root}/dump.tar.gz`;
  putFile(`${directory}/table.sql`, "SELECT 1;");
  await tarGz(archive, directory);
  expect(fileInfo(archive).size).toBeGreaterThan(0);
  removeTree(root);
});

test("tarGz reports command and spawn failures", async () => {
  const failed = new EventEmitter();
  const failure = tarGz("x", "y", undefined, { spawn: () => failed });
  failed.emit("close", 2);
  await expect(failure).rejects.toThrow("tar failed: 2");
  const spawnFailure = new EventEmitter();
  const rejected = tarGz("x", "y", undefined, { spawn: () => spawnFailure });
  spawnFailure.emit("error", new Error("spawn failed"));
  await expect(rejected).rejects.toThrow("spawn failed");
  const stderrFailure = new EventEmitter();
  stderrFailure.stderr = new EventEmitter();
  const detailed = tarGz("x", "y", undefined, { spawn: () => stderrFailure });
  stderrFailure.stderr.emit("data", "missing directory");
  stderrFailure.emit("close", 2);
  await expect(detailed).rejects.toThrow("tar failed: missing directory");
});
