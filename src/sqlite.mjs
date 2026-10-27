import { createReadStream } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { parse } from "csv-parse";
import { identifier } from "./schema.mjs";

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
  const createRead = deps.createReadStream ?? createReadStream;
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
      let rowNumber = 0;
      try {
        const source = createRead(table.csv);
        const parser = parse({
          bom: true,
          skip_empty_lines: true,
          relax_column_count: true,
        });
        source.on("error", (error) => parser.destroy(error));
        const records = source.pipe(parser);
        for await (const record of records) {
          rowNumber += 1;
          if (rowNumber === 1) continue;
          if (record.length !== table.columns.length) {
            throw new Error(`Expected ${table.columns.length} fields, received ${record.length}`);
          }
          insert.run(...record);
        }
      } catch (error) {
        throw new Error(
          `Failed importing ${table.table} from ${table.csv}${rowNumber ? ` near record ${rowNumber}` : ""}: ${error.message}`,
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
