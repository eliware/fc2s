import mysql from "mysql2/promise";
import { createReadStream, readFileSync } from "node:fs";
import { dumpTable as dumpTableImpl } from "./mysql/table-dumper.mjs";

export function db(config, deps = {}) {
  const client = deps.mysql ?? mysql;
  const streamFactory = deps.createReadStream ?? createReadStream;
  const readFile = deps.readFileSync ?? readFileSync;
  return client.createConnection({
    host: config.host,
    port: config.port,
    user: config.user,
    password: config.password,
    ...(config.sslCa
      ? {
          ssl: {
            ca: readFile(config.sslCa),
            rejectUnauthorized: true,
            verifyIdentity: true,
          },
        }
      : {}),
    multipleStatements: true,
    infileStreamFactory: (file) => streamFactory(file),
  });
}

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

export async function dumpTable(...args) {
  return dumpTableImpl(...args);
}
