import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { process as processDatasets, processDate, defaultDependencies } from '../src/process.mjs';

const cfg = (exportDir) => ({ host: 'h', user: 'u', password: 'p', port: 3306, prefix: 'P_', exportDir });

test('process selects latest, current, and all through injection', async () => {
  const calls = [];
  const dependencies = { availableDates: async () => ['2025-03-01', '2025-02-01', '2025-01-01'], processDate: async (date) => { calls.push(date); return date; } };
  await expect(processDatasets('latest', {}, dependencies)).resolves.toEqual(['2025-03-01']);
  await expect(processDatasets('current', {}, dependencies)).resolves.toEqual(['2025-02-01']);
  await expect(processDatasets('all', {}, dependencies)).resolves.toEqual(['2025-01-01', '2025-02-01', '2025-03-01']);
  expect(calls).toHaveLength(5);
  await expect(processDatasets('latest', {}, { availableDates: async () => [] })).rejects.toThrow('No FAA dates');
});

test('processDate orchestrates and cleans successful work', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'fc2s-process-'));
  const removed = [];
  const connection = { query: async () => {}, end: async () => {} };
  const dependencies = {
    config: () => cfg(root), tempDir: async () => '/tmp/work', mkdir: async () => {},
    download: async () => {}, extract: async () => {}, schema: async () => [{ table: 'T', sql: 'CREATE' }],
    db: async () => connection, dumpTable: async () => {}, tarGz: async () => {},
    stat: async () => ({ size: 1 }), rm: async (target) => removed.push(target),
  };
  await expect(processDate('2025-01-02', {}, dependencies)).resolves.toBe(path.join(root, 'P_2025_01_02.tar.gz'));
  expect(removed).toEqual(['/tmp/work', path.join(root, 'P_2025_01_02')]);
  await fs.rm(root, { recursive: true, force: true });
});

test('processDate preserves dump directory when archive fails', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'fc2s-process-'));
  const removed = [];
  const dependencies = {
    config: () => cfg(root), tempDir: async () => '/tmp/work', mkdir: async () => {}, download: async () => {}, extract: async () => {},
    schema: async () => [], db: async () => ({ query: async () => {}, end: async () => {} }), stat: async () => ({ size: 1 }),
    rm: async (target) => removed.push(target), tarGz: async () => { throw new Error('archive failed'); },
  };
  await expect(processDate('2025-01-02', {}, dependencies)).rejects.toThrow('archive failed');
  expect(removed).toEqual(['/tmp/work']);
  await fs.rm(root, { recursive: true, force: true });
});

test('process applies default arguments with injected date processing', async () => {
  const calls = [];
  await expect(processDatasets(undefined, undefined, {
    availableDates: async () => ['2025-03-01'],
    processDate: async (date) => { calls.push(date); return date; },
  })).resolves.toEqual(['2025-03-01']);
  expect(calls).toEqual(['2025-03-01']);
});

test('processDate applies default overrides with injected dependencies', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'fc2s-process-'));
  const dependencies = {
    config: () => cfg(root), tempDir: async () => '/tmp/work', mkdir: async () => {},
    download: async () => {}, extract: async () => {}, schema: async () => [],
    db: async () => ({ query: async () => {}, end: async () => {} }),
    dumpTable: async () => {}, tarGz: async () => {}, stat: async () => ({ size: 1 }),
    rm: async () => {},
  };
  await expect(processDate('2025-01-02', undefined, dependencies))
    .resolves.toBe(path.join(root, 'P_2025_01_02.tar.gz'));
  await fs.rm(root, { recursive: true, force: true });
});

test('processDate rejects empty archives and still cleans work', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'fc2s-process-'));
  const removed = [];
  const dependencies = {
    config: () => cfg(root), tempDir: async () => '/tmp/work', mkdir: async () => {},
    download: async () => {}, extract: async () => {}, schema: async () => [],
    db: async () => ({ query: async () => {}, end: async () => {} }),
    stat: async () => ({ size: 0 }), rm: async (target) => removed.push(target),
    tarGz: async () => {},
  };
  await expect(processDate('2025-01-02', {}, dependencies)).rejects.toThrow('Empty archive');
  expect(removed).toEqual(['/tmp/work']);
  await fs.rm(root, { recursive: true, force: true });
});

test('processDate ends connection and cleans work when SQL fails', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'fc2s-process-'));
  const removed = [];
  let ended = false;
  const dependencies = {
    config: () => cfg(root), tempDir: async () => '/tmp/work', mkdir: async () => {},
    download: async () => {}, extract: async () => {}, schema: async () => [{ table: 'T', sql: 'BAD' }],
    db: async () => ({ query: async () => { throw new Error('SQL failed'); }, end: async () => { ended = true; } }),
    rm: async (target) => removed.push(target),
  };
  await expect(processDate('2025-01-02', {}, dependencies)).rejects.toThrow('SQL failed');
  expect(ended).toBe(true);
  expect(removed).toEqual(['/tmp/work']);
  await fs.rm(root, { recursive: true, force: true });
});


test('default dependency container is fully replaceable for isolated runs', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'fc2s-process-'));
  const original = { ...defaultDependencies };
  const calls = [];
  Object.assign(defaultDependencies, {
    config: () => cfg(root), tempDir: async () => '/tmp/work', mkdir: async () => {},
    download: async () => {}, extract: async () => {}, schema: async () => [],
    db: async () => ({ query: async () => {}, end: async () => {} }),
    dumpTable: async () => {}, tarGz: async () => {}, stat: async () => ({ size: 1 }),
    rm: async () => {}, availableDates: async () => ['2025-01-02'],
    processDate: async (date) => { calls.push(date); return date; },
  });
  try {
    await expect(processDate('2025-01-02', undefined, undefined))
      .resolves.toBe(path.join(root, 'P_2025_01_02.tar.gz'));
    await expect(processDatasets()).resolves.toEqual(['2025-01-02']);
    expect(calls).toEqual(['2025-01-02']);
  } finally {
    delete defaultDependencies.processDate;
    Object.assign(defaultDependencies, original);
    await fs.rm(root, { recursive: true, force: true });
  }
});

test('process uses injected defaults when processDate is omitted', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'fc2s-process-'));
  const original = { ...defaultDependencies };
  Object.assign(defaultDependencies, {
    config: () => cfg(root), tempDir: async () => '/tmp/work', mkdir: async () => {},
    download: async () => {}, extract: async () => {}, schema: async () => [],
    db: async () => ({ query: async () => {}, end: async () => {} }),
    dumpTable: async () => {}, tarGz: async () => {}, stat: async () => ({ size: 1 }),
    rm: async () => {},
  });
  try {
    await expect(processDatasets('latest', {}, {
      availableDates: async () => ['2025-01-02'],
    })).resolves.toEqual([path.join(root, 'P_2025_01_02.tar.gz')]);
  } finally {
    Object.assign(defaultDependencies, original);
    await fs.rm(root, { recursive: true, force: true });
  }
});
