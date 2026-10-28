import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import AdmZip from "adm-zip";
import { log, step } from "../debug.mjs";
import { resolveEntry } from "./extractor/path-policy.mjs";

export async function extract(zip, output, deps = {}) {
  return step(`extract ${zip}`, async () => {
    await mkdir(output, { recursive: true });
    const Zip = deps.AdmZip ?? AdmZip;
    const archive = new Zip(zip);
    const entries = archive.getEntries();
    log("zip entries", {
      count: entries.length,
      names: entries.slice(0, 20).map((entry) => entry.entryName),
    });
    for (const entry of entries) {
      const target = resolveEntry(output, entry.entryName);
      if (entry.isDirectory) {
        await mkdir(target, { recursive: true });
      } else {
        await mkdir(path.dirname(target), { recursive: true });
        await writeFile(target, entry.getData());
      }
    }
  });
}
