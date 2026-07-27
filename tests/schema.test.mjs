import {identifier} from '../src/schema.mjs';
test('validates identifiers',()=>{expect(identifier('AIRPORT')).toBe('`AIRPORT`'); expect(()=>identifier('bad-name')).toThrow();});

import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { schema } from '../src/schema.mjs';

test('schema generates SQL for CSV schema and matching data', async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'fc2s-schema-'));
  await fs.writeFile(path.join(dir, 'TEST_CSV_DATA_STRUCTURE.csv'),
    'CSV File,Field,Length,Type,Nullable\nTEST,ID,5,VARCHAR,Yes\nTEST,AMOUNT,,NUMBER,No\nTEST,NOTE,,TEXT,Yes\n');
  await fs.writeFile(path.join(dir, 'TEST.csv'), 'ID,AMOUNT,NOTE\n');
  const result = await schema(dir);
  expect(result).toHaveLength(1);
  expect(result[0].sql).toContain('VARCHAR(5)');
  expect(result[0].sql).toContain('DECIMAL(30,10) NOT NULL');
  await fs.rm(dir, { recursive: true, force: true });
});

test('schema skips tables without data CSV', async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'fc2s-schema-'));
  await fs.writeFile(path.join(dir, 'X_CSV_DATA_STRUCTURE.csv'), 'CSV File,Field,Length,Type,Nullable\nMISSING,ID,5,VARCHAR,Yes\n');
  await expect(schema(dir)).resolves.toEqual([]);
  await fs.rm(dir, { recursive: true, force: true });
});

test('schema rejects missing and malformed files and unsafe columns', async () => {
  const empty = await fs.mkdtemp(path.join(os.tmpdir(), 'fc2s-schema-'));
  await expect(schema(empty)).rejects.toThrow('No schema files');
  await fs.writeFile(path.join(empty, 'X_CSV_DATA_STRUCTURE.csv'), '"unterminated');
  await expect(schema(empty)).rejects.toThrow('Failed parsing');
  await fs.writeFile(path.join(empty, 'X_CSV_DATA_STRUCTURE.csv'), 'CSV File,Field,Length,Type,Nullable\nX,bad-name,1,VARCHAR,Yes\n');
  await fs.writeFile(path.join(empty, 'X.csv'), 'x\n');
  await expect(schema(empty)).rejects.toThrow('Unsafe column name');
  await fs.rm(empty, { recursive: true, force: true });
});

test('schema skips tables with ambiguous data CSV matches', async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'fc2s-schema-'));
  await fs.writeFile(path.join(dir, 'X_CSV_DATA_STRUCTURE.csv'),
    'CSV File,Field,Length,Type,Nullable\nX,ID,5,VARCHAR,Yes\n');
  await fs.writeFile(path.join(dir, 'X_first.csv'), 'ID\n');
  await fs.writeFile(path.join(dir, 'X_second.csv'), 'ID\n');
  await expect(schema(dir)).resolves.toEqual([]);
  await fs.rm(dir, { recursive: true, force: true });
});

test('schema defaults invalid VARCHAR length to 255', async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'fc2s-schema-'));
  await fs.writeFile(path.join(dir, 'X_CSV_DATA_STRUCTURE.csv'),
    'CSV File,Field,Length,Type,Nullable\nX,ID,,VARCHAR,Yes\n');
  await fs.writeFile(path.join(dir, 'X.csv'), 'ID\n');
  const result = await schema(dir);
  expect(result[0].sql).toContain('VARCHAR(255)');
  await fs.rm(dir, { recursive: true, force: true });
});

test('schema uses a single prefixed data CSV match', async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'fc2s-schema-'));
  await fs.writeFile(path.join(dir, 'X_CSV_DATA_STRUCTURE.csv'),
    'CSV File,Field,Length,Type,Nullable\nX,ID,5,VARCHAR,Yes\n');
  await fs.writeFile(path.join(dir, 'X_extra.csv'), 'ID\n');
  const result = await schema(dir);
  expect(result).toHaveLength(1);
  expect(result[0].sql).toContain('X_extra.csv');
  await fs.rm(dir, { recursive: true, force: true });
});
