import path from 'node:path';
import { mkdir, rm, stat } from 'node:fs/promises';
import { config } from '../src/config.mjs';
import { db, dumpTable } from '../src/mysql.mjs';
import { tarGz } from '../src/archive.mjs';

const dbName = globalThis.process.argv[2];
if (!dbName || !/^[A-Za-z0-9_$]+$/.test(dbName)) {
  console.error('Usage: node examples/dump_db.mjs <db_name>');
  globalThis.process.exitCode = 1;
} else {
  const c = config();
  const dumpDir = path.resolve(c.exportDir, dbName);
  const archive = path.resolve(c.exportDir, `${dbName}.tar.gz`);
  let archived = false;

  try {
    await mkdir(c.exportDir, { recursive: true });
    await rm(dumpDir, { recursive: true, force: true });
    await mkdir(dumpDir, { recursive: true });

    const conn = await db(c);
    let tables;
    try {
      const [rows] = await conn.query(`SHOW TABLES FROM \`${dbName}\``);
      tables = rows.map(row => Object.values(row)[0]);
    } finally {
      await conn.end();
    }

    for (const table of tables) {
      if (!/^[A-Za-z0-9_$]+$/.test(table)) throw new Error(`Unsafe table name: ${table}`);
      await dumpTable(c, dbName, table, path.join(dumpDir, `${table}.sql`));
    }

    await tarGz(archive, dumpDir);
    if ((await stat(archive)).size === 0) throw new Error('Empty archive');
    archived = true;
    console.log(archive);
  } catch (e) {
    console.error(e.stack || e.message);
    globalThis.process.exitCode = 1;
  } finally {
    if (archived) await rm(dumpDir, { recursive: true, force: true });
  }
}
