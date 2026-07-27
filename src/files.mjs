import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import AdmZip from 'adm-zip';
import { log, step } from './debug.mjs';

export async function tempDir() {
  const directory = await mkdtemp(path.join(tmpdir(), 'fc2s-'));
  log('temporary directory', directory);
  return directory;
}

export async function download(url, file) {
  return step(`download ${url}`, async () => {
    const response = await fetch(url);
    log('HTTP response', {
      url,
      status: response.status,
      headers: Object.fromEntries(response.headers),
    });
    if (!response.ok) throw new Error(`Download HTTP ${response.status}`);
    const data = Buffer.from(await response.arrayBuffer());
    await writeFile(file, data);
    log('downloaded', { file, bytes: data.length });
  });
}

export async function extract(zip, output, deps = {}) {
  return step(`extract ${zip}`, async () => {
    await mkdir(output, { recursive: true });
    const Zip = deps.AdmZip ?? AdmZip;
    const archive = new Zip(zip);
    const entries = archive.getEntries();
    log('zip entries', {
      count: entries.length,
      names: entries.slice(0, 20).map((entry) => entry.entryName),
    });
    for (const entry of entries) {
      const target = path.resolve(output, entry.entryName);
      if (!target.startsWith(`${path.resolve(output)}${path.sep}`)) {
        throw new Error('Unsafe ZIP path');
      }
      if (entry.isDirectory) {
        await mkdir(target, { recursive: true });
      } else {
        await mkdir(path.dirname(target), { recursive: true });
        await writeFile(target, entry.getData());
      }
    }
  });
}

export { readFile, rm, mkdir };
