import { db as createConnection } from "./mysql/connection.mjs";
import { listTables as listTablesImpl } from "./mysql/table/list.mjs";
import { dumpTable as dumpTableImpl } from "./mysql/table/dumper.mjs";

export function db(...args) {
  return createConnection(...args);
}

export function listTables(...args) {
  return listTablesImpl(...args);
}

export async function dumpTable(...args) {
  return dumpTableImpl(...args);
}
