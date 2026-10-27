import { EventEmitter } from "node:events";
import {
  fileInfo,
  getFile,
  makeDirectory,
  mockEffects,
  putFile,
  removeTree,
} from "../test-fixtures/mock-effects.mjs";

await mockEffects();
const { gzipFile, tarGz } = await import("../src/archive.mjs");

test("tarGz creates an archive through the default mocked child process", async () => {
  const root = makeDirectory("archive");
  const directory = `${root}/dump`;
  const archive = `${root}/dump.tar.gz`;
  putFile(`${directory}/table.sql`, "SELECT 1;");
  await tarGz(archive, directory);
  expect(fileInfo(archive).size).toBeGreaterThan(0);
  removeTree(root);
});

test("gzipFile compresses one file and removes partial output after failure", async () => {
  const root = makeDirectory("gzip");
  const input = `${root}/database.sqlite`;
  const output = `${root}/database.sqlite.gz`;
  putFile(input, "sqlite database bytes");
  await gzipFile(input, output);
  expect(getFile(output)).toEqual(expect.any(Buffer));
  await expect(gzipFile(`${root}/missing.sqlite`, output)).rejects.toThrow("gzip failed");
  expect(() => fileInfo(output)).toThrow();
  removeTree(root);
});

test("tarGz reports command and spawn failures", async () => {
  const root = makeDirectory("tar-error");
  const failed = new EventEmitter();
  const failure = tarGz(`${root}/x.tar.gz`, `${root}/missing`, undefined, { spawn: () => failed });
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
  removeTree(root);
});
