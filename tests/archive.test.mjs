import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { gunzipSync } from 'node:zlib';
import { tarGz } from '../src/archive.mjs';
import { gzipFile } from '../src/archive.mjs';

test('tarGz creates archive with top-level directory', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'fc2s-test-'));
  const dir = path.join(root, 'dump');
  const archive = path.join(root, 'dump.tar.gz');
  await fs.mkdir(dir);
  await fs.writeFile(path.join(dir, 'table.sql'), 'SELECT 1;');
  await tarGz(archive, dir);
  expect((await fs.stat(archive)).size).toBeGreaterThan(0);
  await fs.rm(root, { recursive: true, force: true });
});

test('gzipFile compresses one file and removes partial output after failure', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'fc2s-gzip-'));
  const input = path.join(root, 'database.sqlite');
  const output = path.join(root, 'database.sqlite.gz');
  await fs.writeFile(input, 'sqlite database bytes');
  try {
    await gzipFile(input, output);
    expect(gunzipSync(await fs.readFile(output)).toString()).toBe('sqlite database bytes');
    await expect(gzipFile(path.join(root, 'missing.sqlite'), output)).rejects.toThrow('gzip failed');
    await expect(fs.stat(output)).rejects.toThrow();
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});

test('tarGz rejects when tar cannot archive missing directory', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'fc2s-test-'));
  await expect(tarGz(path.join(root, 'x.tar.gz'), path.join(root, 'missing')))
    .rejects.toThrow('tar failed');
  await fs.rm(root, { recursive: true, force: true });
});

test('tarGz handles spawn failures and silent nonzero exits', async () => {
  const { EventEmitter } = await import('node:events');
  const failed = new EventEmitter();
  const spawnError = tarGz('x', 'y', undefined, { spawn: () => failed });
  failed.emit('error', new Error('spawn failed'));
  await expect(spawnError).rejects.toThrow('spawn failed');

  const exited = new EventEmitter();
  const exitError = tarGz('x', 'y', undefined, { spawn: () => exited });
  exited.emit('close', 2);
  await expect(exitError).rejects.toThrow('tar failed: 2');
});
