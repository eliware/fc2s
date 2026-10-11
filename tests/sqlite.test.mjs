import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { importSqlite } from '../src/sqlite.mjs';

test('imports CSV rows into a standalone SQLite database while preserving text values', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'fc2s-sqlite-'));
  const csv = path.join(root, 'APT.csv');
  const databaseFile = path.join(root, 'nasr.sqlite');
  await fs.writeFile(csv, 'IDENT,VALUE,NOTE\n00123,123,"quoted, value"\n00008,9.25,"line one\nline two"\n');

  try {
    await importSqlite(databaseFile, [{
      table: 'APT', csv,
      columns: [
        { name: 'IDENT', nullable: false },
        { name: 'VALUE', nullable: true },
        { name: 'NOTE', nullable: true },
      ],
    }]);
    const database = new DatabaseSync(databaseFile, { readOnly: true });
    try {
      expect(database.prepare('SELECT * FROM APT ORDER BY rowid').all()).toEqual([
        { IDENT: '00123', VALUE: '123', NOTE: 'quoted, value' },
        { IDENT: '00008', VALUE: '9.25', NOTE: 'line one\nline two' },
      ]);
      expect(database.prepare('PRAGMA table_info(APT)').all()[0].notnull).toBe(1);
    } finally {
      database.close();
    }
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});

test('rejects CSV rows that do not match the schema field count', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'fc2s-sqlite-'));
  const csv = path.join(root, 'bad.csv');
  await fs.writeFile(csv, 'A,B\nonly-one-field\n');
  try {
    await expect(importSqlite(path.join(root, 'bad.sqlite'), [{
      table: 'BAD', csv,
      columns: [{ name: 'A', nullable: true }, { name: 'B', nullable: true }],
    }])).rejects.toThrow('Expected 2 fields, received 1');
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});
