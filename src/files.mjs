import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { log, step } from "./debug.mjs";
export { extract } from "./files/extractor.mjs";

export async function tempDir() {
  const directory = await mkdtemp(path.join(tmpdir(), "fc2s-"));
  log("temporary directory", directory);
  return directory;
}

export async function download(url, file) {
  return step(`download ${url}`, async () => {
    const response = await fetch(url);
    log("HTTP response", {
      url,
      status: response.status,
      headers: Object.fromEntries(response.headers),
    });
    if (!response.ok) throw new Error(`Download HTTP ${response.status}`);
    const data = Buffer.from(await response.arrayBuffer());
    await writeFile(file, data);
    log("downloaded", { file, bytes: data.length });
  });
}

export { readFile, rm, mkdir };
