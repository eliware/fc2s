import path from 'node:path';
import { mkdir as defaultMkdir, stat as defaultStat } from 'node:fs/promises';
import { config as defaultConfig } from './config.mjs';
import { availableDates as defaultAvailableDates, dataUrl } from './fetch-faa.mjs';
import { tempDir as defaultTempDir, download as defaultDownload, extract as defaultExtract, rm as defaultRm } from './files.mjs';
import { schema as defaultSchema, identifier } from './schema.mjs';
import { db as defaultDb, dumpTable as defaultDumpTable } from './mysql.mjs';
import { importSqlite as defaultImportSqlite } from './sqlite.mjs';
import { gzipFile as defaultGzipFile, tarGz as defaultTarGz } from './archive.mjs';
import { log } from './debug.mjs';

export const defaultDependencies = {
  config: defaultConfig, mkdir: defaultMkdir, stat: defaultStat, tempDir: defaultTempDir,
  download: defaultDownload, extract: defaultExtract, rm: defaultRm, schema: defaultSchema,
  db: defaultDb, dumpTable: defaultDumpTable, tarGz: defaultTarGz, availableDates: defaultAvailableDates,
  importSqlite: defaultImportSqlite, gzipFile: defaultGzipFile,
};

export async function processDate(date, overrides = {}, dependencies = {}) {
  const d = { ...defaultDependencies, ...dependencies };
  const c = d.config(overrides);
  const { mkdir, stat, tempDir, download, extract, rm, schema, db, dumpTable, importSqlite, gzipFile, tarGz } = d;
  log('processDate config', { date, host: c.host, port: c.port, user: c.user, exportDir: c.exportDir, prefix: c.prefix });
  const dbName = `${c.prefix}${date}`.replaceAll('-', '_');
  identifier(dbName);
  const work = await tempDir();
  const dumpDir = path.join(c.exportDir, dbName);
  let archived = false;
  try {
    await mkdir(c.exportDir, { recursive: true });
    const zip = path.join(work, 'data.zip');
    const extracted = path.join(work, 'data');
    await download(dataUrl(date), zip);
    await extract(zip, extracted);
    const statements = await schema(extracted);
    await rm(dumpDir, { recursive: true, force: true });
    await mkdir(dumpDir, { recursive: true });
    if (c.driver === 'sqlite') {
      await importSqlite(path.join(dumpDir, `${dbName}.sqlite`), statements);
    } else {
      const conn = await db(c);
      try {
        await conn.query(`DROP DATABASE IF EXISTS ${identifier(dbName)}; CREATE DATABASE ${identifier(dbName)} CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci; USE ${identifier(dbName)};`);
        for (const statement of statements) await conn.query(statement.sql);
      } finally { await conn.end(); }
      for (const statement of statements) await dumpTable(c, dbName, statement.table, path.join(dumpDir, `${statement.table}.sql`));
    }
    const suffix = c.driver === 'sqlite' ? '.sqlite.gz' : '.sql.tar.gz';
    const archive = path.join(c.exportDir, `${dbName}${suffix}`);
    if (c.driver === 'sqlite') {
      await gzipFile(path.join(dumpDir, `${dbName}.sqlite`), archive);
    } else {
      await tarGz(archive, dumpDir);
    }
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
