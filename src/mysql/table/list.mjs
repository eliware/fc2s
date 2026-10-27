import { db } from "../connection.mjs";

export async function listTables(config, database, deps = {}) {
  if (!/^[A-Za-z0-9_$]+$/.test(database)) throw new Error(`Unsafe database name: ${database}`);
  const connection = await db(config, deps);
  try {
    const [rows] = await connection.query(`SHOW TABLES FROM \`${database}\``);
    return rows.map((row) => Object.values(row)[0]);
  } finally {
    await connection.end();
  }
}
