import path from 'node:path';
import { mkdir as defaultMkdir, stat as defaultStat } from 'node:fs/promises';
import { config as defaultConfig } from './config.mjs';
import { availableDates as defaultAvailableDates, dataUrl } from './fetch-faa.mjs';
import { tempDir as defaultTempDir, download as defaultDownload, extract as defaultExtract, rm as defaultRm } from './files.mjs';
import { schema as defaultSchema, identifier } from './schema.mjs';
import { db as defaultDb, dumpTable as defaultDumpTable } from './mysql.mjs';
import { tarGz as defaultTarGz } from './archive.mjs';
import { log } from './debug.mjs';

export const defaultDependencies = {
  config: defaultConfig, mkdir: defaultMkdir, stat: defaultStat, tempDir: defaultTempDir,
  download: defaultDownload, extract: defaultExtract, rm: defaultRm, schema: defaultSchema,
  db: defaultDb, dumpTable: defaultDumpTable, tarGz: defaultTarGz, availableDates: defaultAvailableDates,
};

export async function processDate(date, overrides = {}, dependencies = {}) {
  const d = { ...defaultDependencies, ...dependencies };
  const c = d.config(overrides);
  const { mkdir, stat, tempDir, download, extract, rm, schema, db, dumpTable, tarGz } = d;
  log('processDate config', { date, host: c.host, port: c.port, user: c.user, exportDir: c.exportDir, prefix: c.prefix });
  const work = await tempDir();
  const dbName = `${c.prefix}${date}`.replaceAll('-', '_');
  const dumpDir = path.join(c.exportDir, dbName);
  await mkdir(c.exportDir, { recursive: true });
  let archived = false;
  try {
    const zip = path.join(work, 'data.zip');
    const extracted = path.join(work, 'data');
    await download(dataUrl(date), zip);
    await extract(zip, extracted);
    const statements = await schema(extracted);
    const conn = await db(c);
    try {
      await conn.query(`DROP DATABASE IF EXISTS ${identifier(dbName)}; CREATE DATABASE ${identifier(dbName)} CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci; USE ${identifier(dbName)};`);
      for (const statement of statements) await conn.query(statement.sql);
    } finally { await conn.end(); }
    await mkdir(dumpDir, { recursive: true });
    for (const statement of statements) await dumpTable(c, dbName, statement.table, path.join(dumpDir, `${statement.table}.sql`));
    const archive = path.join(c.exportDir, `${dbName}.tar.gz`);
    await tarGz(archive, dumpDir);
    if ((await stat(archive)).size === 0) throw new Error('Empty archive');
    archived = true;
    return archive;
  } finally {
    await rm(work, { recursive: true, force: true });
    if (archived) await rm(dumpDir, { recursive: true, force: true });
  }
}

export async function process(mode = 'current', overrides = {}, dependencies = {}) {
  const d = { ...defaultDependencies, ...dependencies };
  const availableDates = d.availableDates;
  const processDateImpl = d.processDate ?? ((date) => processDate(date, overrides, d));
  const dates = await availableDates();
  if (!dates.length) throw new Error('No FAA dates');
  const selected = mode === 'all' ? [...dates].reverse() : [mode === 'latest' ? dates[0] : dates[Math.min(1, dates.length - 1)]];
  return Promise.all(selected.map(processDateImpl));
}
