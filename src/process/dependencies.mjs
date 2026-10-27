import { mkdir as defaultMkdir, stat as defaultStat } from "node:fs/promises";
import { config as defaultConfig } from "../config.mjs";
import { availableDates as defaultAvailableDates } from "../fetch-faa.mjs";
import {
  tempDir as defaultTempDir,
  download as defaultDownload,
  extract as defaultExtract,
  rm as defaultRm,
} from "../files.mjs";
import { schema as defaultSchema } from "../schema.mjs";
import { db as defaultDb, dumpTable as defaultDumpTable } from "../mysql.mjs";
import { importSqlite as defaultImportSqlite } from "../sqlite.mjs";
import { gzipFile as defaultGzipFile, tarGz as defaultTarGz } from "../archive.mjs";

export const defaultDependencies = {
  config: defaultConfig,
  mkdir: defaultMkdir,
  stat: defaultStat,
  tempDir: defaultTempDir,
  download: defaultDownload,
  extract: defaultExtract,
  rm: defaultRm,
  schema: defaultSchema,
  db: defaultDb,
  dumpTable: defaultDumpTable,
  tarGz: defaultTarGz,
  availableDates: defaultAvailableDates,
  importSqlite: defaultImportSqlite,
  gzipFile: defaultGzipFile,
};
