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

export async function dumpTable(...args) {
  return dumpTableImpl(...args);
}
