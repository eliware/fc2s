import { mkdir, readFile, rm } from "node:fs/promises";
import { extract as extractImpl } from "./files/extractor.mjs";
import { download as downloadImpl } from "./files/transfer.mjs";
import { tempDir as tempDirImpl } from "./files/temp-directory.mjs";

export function extract(...args) {
  return extractImpl(...args);
}

export function download(...args) {
  return downloadImpl(...args);
}

export function tempDir(...args) {
  return tempDirImpl(...args);
}

export { mkdir, readFile, rm };
