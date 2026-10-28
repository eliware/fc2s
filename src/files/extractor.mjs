import { mkdir, realpath, writeFile } from "node:fs/promises";
import path from "node:path";
import AdmZip from "adm-zip";
import { log, step } from "../debug.mjs";
import { assertNoSymlinkPath, resolveEntry } from "./extractor/path-policy.mjs";

export async function extract(zip, output, deps = {}) {
  return step(`extract ${zip}`, async () => {
    await mkdir(output, { recursive: true });
    const root = await realpath(output);
    const Zip = deps.AdmZip ?? AdmZip;
    const archive = new Zip(zip);
    const entries = archive.getEntries();
    log("zip entries", {
      count: entries.length,
      names: entries.slice(0, 20).map((entry) => entry.entryName),
    });
    for (const entry of entries) {
      const unixFileType = ((entry.attr ?? 0) >>> 16) & 0xf000;
      if (unixFileType === 0xa000) throw new Error("Unsafe ZIP symbolic link");
      const target = resolveEntry(root, entry.entryName);
      if (entry.isDirectory) {
        await assertNoSymlinkPath(root, target);
        await mkdir(target, { recursive: true });
      } else {
        await assertNoSymlinkPath(root, path.dirname(target));
        await mkdir(path.dirname(target), { recursive: true });
        await assertNoSymlinkPath(root, target);
        await writeFile(target, entry.getData());
      }
    }
  });
}
