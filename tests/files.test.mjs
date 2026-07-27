import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import AdmZip from 'adm-zip';
import { extract, tempDir, download } from '../src/files.mjs';

test('tempDir creates unique directory', async () => {
  const a = await tempDir(); const b = await tempDir();
  expect(a).not.toBe(b);
  await fs.rm(a, { recursive: true, force: true }); await fs.rm(b, { recursive: true, force: true });
});
test('extract writes ZIP files', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'fc2s-test-'));
  const zip = path.join(root, 'x.zip'); const out = path.join(root, 'out');
  const archive = new AdmZip(); archive.addFile('nested/file.txt', Buffer.from('x')); archive.writeZip(zip);
  await extract(zip, out);
  await expect(fs.readFile(path.join(out, 'nested/file.txt'), 'utf8')).resolves.toBe('x');
  await fs.rm(root, { recursive: true, force: true });
});
test('download rejects HTTP errors', async () => {
  const old = globalThis.fetch;
  globalThis.fetch = async () => ({ ok: false, status: 503, headers: [] });
  await expect(download('x', '/tmp/x')).rejects.toThrow('Download HTTP 503');
  globalThis.fetch = old;
});

test('download writes successful response', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'fc2s-test-'));
  const file = path.join(root, 'data');
  const old = globalThis.fetch;
  globalThis.fetch = async () => ({ ok: true, status: 200, headers: new Headers(), arrayBuffer: async () => Uint8Array.from([1, 2]).buffer });
  await download('x', file);
  await expect(fs.readFile(file)).resolves.toEqual(Buffer.from([1, 2]));
  globalThis.fetch = old;
  await fs.rm(root, { recursive: true, force: true });
});

test('extract handles directory entries', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'fc2s-test-'));
  const zip = path.join(root, 'dir.zip'); const out = path.join(root, 'out');
  const archive = new AdmZip(); archive.addFile('nested/', Buffer.alloc(0)); archive.writeZip(zip);
  await extract(zip, out);
  await expect(fs.stat(path.join(out, 'nested'))).resolves.toBeDefined();
  await fs.rm(root, { recursive: true, force: true });
});

test('extract rejects unsafe ZIP paths', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'fc2s-test-'));
  const zip = path.join(root, 'unsafe.zip'); const out = path.join(root, 'out');
  const unsafe = {
    entryName: '../escape.txt', isDirectory: false, getData: () => Buffer.from('x'),
  };
  class FakeZip { getEntries() { return [unsafe]; } }
  await expect(extract(zip, out, { AdmZip: FakeZip })).rejects.toThrow('Unsafe ZIP path');
  await fs.rm(root, { recursive: true, force: true });
});
