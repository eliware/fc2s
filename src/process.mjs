import path from "node:path";
import { dataUrl } from "./fetch-faa.mjs";
import { identifier } from "./schema.mjs";
import { log } from "./debug.mjs";
import { createProcess } from "./process/selector.mjs";
import { cleanupProcess } from "./process/cleanup.mjs";
import { defaultDependencies } from "./process/dependencies.mjs";

export { defaultDependencies };

export async function processDate(date, overrides = {}, dependencies = {}) {
  const url = dataUrl(date);
  const d = { ...defaultDependencies, ...dependencies };
  const c = d.config(overrides);
  const {
    mkdir,
    stat,
    tempDir,
    download,
    extract,
    rm,
    schema,
    db,
    dumpTable,
    importSqlite,
    gzipFile,
    tarGz,
    atomicArchive,
  } = d;
  log("processDate config", {
    date,
    host: c.host,
    port: c.port,
    user: c.user,
    exportDir: c.exportDir,
    prefix: c.prefix,
  });
  const dbName = `${c.prefix}${date}`.replaceAll("-", "_");
  identifier(dbName);
  const work = await tempDir();
  const dumpDir = path.join(c.exportDir, dbName);
  let archived = false;
  let result;
  let operationError;
  try {
    await mkdir(c.exportDir, { recursive: true });
    const zip = path.join(work, "data.zip");
    const extracted = path.join(work, "data");
    await download(url, zip);
    await extract(zip, extracted);
    const statements = await schema(extracted);
    await rm(dumpDir, { recursive: true, force: true });
    await mkdir(dumpDir, { recursive: true });
    if (c.driver === "sqlite") {
      await importSqlite(path.join(dumpDir, `${dbName}.sqlite`), statements);
    } else {
      const conn = await db(c);
      try {
        await conn.query(
          `DROP DATABASE IF EXISTS ${identifier(dbName)}; CREATE DATABASE ${identifier(dbName)} CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci; USE ${identifier(dbName)};`,
        );
        for (const statement of statements) await conn.query(statement.sql);
      } finally {
        await conn.end();
      }
      for (const statement of statements)
        await dumpTable(c, dbName, statement.table, path.join(dumpDir, `${statement.table}.sql`));
    }
    const suffix = c.driver === "sqlite" ? ".sqlite.gz" : ".sql.tar.gz";
    const archive = path.join(c.exportDir, `${dbName}${suffix}`);
    await atomicArchive(
      archive,
      async (temporary) => {
        if (c.driver === "sqlite") {
          await gzipFile(path.join(dumpDir, `${dbName}.sqlite`), temporary);
        } else {
          await tarGz(temporary, dumpDir);
        }
      },
      { stat },
    );
    archived = true;
    result = archive;
  } catch (error) {
    operationError = error;
  }

  await cleanupProcess(work, dumpDir, archived, rm, operationError);
  return result;
}

export const process = createProcess(processDate, defaultDependencies);
