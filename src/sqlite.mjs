import { DatabaseSync } from "node:sqlite";
import { readCsvRows } from "./sqlite/csv-reader.mjs";
import { createTableWriter } from "./sqlite/table-writer.mjs";
import { transaction } from "./sqlite/transaction.mjs";

export async function importSqlite(file, tables, deps = {}) {
  const Database = deps.DatabaseSync ?? DatabaseSync;
  const database = new Database(file);
  await transaction(database, async () => {
    for (const table of tables) {
      const insert = createTableWriter(database, table);
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
