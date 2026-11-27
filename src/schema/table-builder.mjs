import path from "node:path";
import log from "../debug.mjs";
import csvForTable from "./csv-for-table.mjs";
import buildTable from "./sql-builder.mjs";

export default function buildTables(dir, { file, rows }, dataFiles) {
  const result = [];
  let table;
  let columns = [];
  const flush = () => {
    if (!table || !columns.length) return;
    const filename = csvForTable(table, dataFiles);
    if (!filename) {
      log("skipping schema table without CSV", { table });
      return;
    }
    const csv = path.join(dir, filename);
    result.push(buildTable(table, csv, columns));
    log("schema table", { table, columns: columns.length, csv });
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
  return result;
}
