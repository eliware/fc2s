import { jest } from "@jest/globals";
import { EventEmitter } from "node:events";
import { PassThrough } from "node:stream";
import { fs as memoryFs, vol } from "memfs";

let nextDirectory = 0;
let configured = false;
let zipEntries = [];

export async function mockEffects() {
  if (configured) return;
  configured = true;
  await jest.unstable_mockModule("node:fs/promises", async () => ({ ...memoryFs.promises }));
  await jest.unstable_mockModule("node:fs", async () => ({ ...memoryFs }));
  await jest.unstable_mockModule("node:child_process", async () => ({
    spawn: (command, args = []) => {
      const child = new EventEmitter();
      child.stdout = new PassThrough();
      child.stderr = new PassThrough();
      queueMicrotask(() => {
        if (command === "tar" && args[0] === "-czf") putFile(args[1], "mock archive");
        if (command === "fake-output") child.stdout.end("ok");
        else child.stdout.end();
        child.stderr.end();
        child.emit("close", 0);
      });
      return child;
    },
  }));
  await jest.unstable_mockModule("mysql2/promise", async () => ({
    default: {
      createConnection: async () => {
        throw new Error("mock connection failure");
      },
    },
  }));
  await jest.unstable_mockModule("adm-zip", async () => ({
    default: class {
      getEntries() {
        return zipEntries;
      }
    },
  }));
  resetFiles();
}

export function setZipEntries(entries) {
  zipEntries = entries;
}

export function resetFiles() {
  vol.reset();
  vol.mkdirSync("/tmp", { recursive: true });
  nextDirectory = 0;
}

export function makeDirectory(prefix = "test") {
  const directory = `/workspace/${prefix}-${nextDirectory++}`;
  vol.mkdirSync(directory, { recursive: true });
  return directory;
}

export function putFile(file, content) {
  vol.mkdirSync(file.slice(0, file.lastIndexOf("/")), { recursive: true });
  vol.writeFileSync(file, content);
}

export function getFile(file, encoding) {
  return vol.readFileSync(file, encoding);
}

export function fileInfo(file) {
  return vol.statSync(file);
}

export function removeTree(directory) {
  vol.rmSync(directory, { recursive: true, force: true });
}

export function fileExists(file) {
  try {
    vol.statSync(file);
    return true;
  } catch {
    return false;
  }
}
