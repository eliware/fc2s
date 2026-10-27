import path from "node:path";
import { log } from "./debug.mjs";
import { csvForTable, readSchemaFiles } from "./schema/parser.mjs";
import { buildTable } from "./schema/sql-builder.mjs";
import { identifier } from "./schema/identifier.mjs";

export { identifier };

export async function schema(dir) {
  const { files, dataFiles } = await readSchemaFiles(dir);
  if (!files.length) throw new Error(`No schema files in ${dir}`);

  const result = [];
  for (const { file, rows } of files) {
    let table;
    let columns = [];
    const flush = () => {
      if (!table || !columns.length) return;
      const filename = csvForTable(table, dataFiles);
      if (!filename) {
        log("skipping schema table without CSV", { table });
        return;
      }
      result.push(buildTable(table, path.join(dir, filename), columns));
      log("schema table", { table, columns: columns.length, csv: path.join(dir, filename) });
    };

    for (const item of rows) {
      const row = item.record;
      log("schema row", { file, line: item.info.lines, fields: row.length, first: row[0] });
      if (row.every((value) => value === "") || row[0] === "CSV File") continue;
      if (row[0] !== table) {
        flush();
        table = row[0];
        columns = [];
      }
      columns.push(row);
    }
    flush();
  }
  return result;
}
