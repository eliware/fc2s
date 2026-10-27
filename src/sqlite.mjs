import { DatabaseSync } from "node:sqlite";
import { identifier } from "./schema/sql-builder.mjs";
import { readCsvRows } from "./sqlite/csv-reader.mjs";

function quoteIdentifier(value, isColumn = false) {
  if (isColumn) {
    if (!/^[A-Za-z_][A-Za-z0-9_ ]*$/.test(value)) throw new Error(`Unsafe column name: ${value}`);
  } else {
    identifier(value);
  }
  return `"${value.replaceAll('"', '""')}"`;
}

export async function importSqlite(file, tables, deps = {}) {
  const Database = deps.DatabaseSync ?? DatabaseSync;
  const database = new Database(file);
  let inTransaction = false;

  try {
    database.exec("PRAGMA journal_mode = DELETE; PRAGMA synchronous = FULL; BEGIN IMMEDIATE;");
    inTransaction = true;

    for (const table of tables) {
      const names = table.columns.map((column) => quoteIdentifier(column.name, true));
      const definitions = table.columns.map(
        (column, index) => `${names[index]} TEXT${column.nullable ? "" : " NOT NULL"}`,
      );
      database.exec(`CREATE TABLE ${quoteIdentifier(table.table)} (${definitions.join(", ")});`);

      const insert = database.prepare(
        `INSERT INTO ${quoteIdentifier(table.table)} (${names.join(", ")}) VALUES (${names.map(() => "?").join(", ")})`,
      );
      let currentRecord;
      try {
        for await (const { record, rowNumber } of readCsvRows(
          table.csv,
          table.columns.length,
          deps,
        )) {
          currentRecord = rowNumber;
          insert.run(...record);
        }
      } catch (error) {
        const location = error.rowNumber ?? currentRecord;
        throw new Error(
          `Failed importing ${table.table} from ${table.csv}${location ? ` near record ${location}` : ""}: ${error.message}`,
          { cause: error },
        );
      }
    }

    database.exec("COMMIT;");
    inTransaction = false;
  } catch (error) {
    if (inTransaction) {
      try {
        database.exec("ROLLBACK;");
      } catch {
        /* Preserve the import error. */
      }
    }
    throw error;
  } finally {
    database.close();
  }
}
