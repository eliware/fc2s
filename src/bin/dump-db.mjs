import path from "node:path";
import { mkdir, rm, stat } from "node:fs/promises";
import { config } from "../config.mjs";
import { listTables, dumpTable } from "../mysql.mjs";
import { atomicArchive, tarGz } from "../archive.mjs";

const defaultDependencies = {
  config,
  mkdir,
  rm,
  stat,
  listTables,
  dumpTable,
  tarGz,
  atomicArchive,
};

export async function dumpDatabase(dbName, deps = {}) {
  if (!dbName || !/^[A-Za-z0-9_$]+$/.test(dbName)) {
    throw new Error("Usage: node bin/dump_db.mjs <db_name>");
  }
  const d = { ...defaultDependencies, ...deps };
  const c = d.config();
  const dumpDir = path.resolve(c.exportDir, dbName);
  const archive = path.resolve(c.exportDir, `${dbName}.sql.tar.gz`);
  try {
    await d.mkdir(c.exportDir, { recursive: true });
    await d.rm(dumpDir, { recursive: true, force: true });
    await d.mkdir(dumpDir, { recursive: true });

    const tables = await d.listTables(c, dbName);
    for (const table of tables) {
      if (!/^[A-Za-z0-9_$]+$/.test(table)) throw new Error(`Unsafe table name: ${table}`);
      await d.dumpTable(c, dbName, table, path.join(dumpDir, `${table}.sql`));
    }

    await d.atomicArchive(archive, (temporary) => d.tarGz(temporary, dumpDir), {
      stat: d.stat,
    });
    return archive;
  } finally {
    await d.rm(dumpDir, { recursive: true, force: true });
  }
}
