import { DatabaseSync } from "node:sqlite";
import { quoteIdentifier } from "./sqlite/identifier.mjs";
import { readCsvRows } from "./sqlite/csv-reader.mjs";
import { transaction } from "./sqlite/transaction.mjs";

export async function importSqlite(file, tables, deps = {}) {
  const Database = deps.DatabaseSync ?? DatabaseSync;
  const database = new Database(file);
  await transaction(database, async () => {
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
          table.columns.map((column) => column.name),
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
  });
}
