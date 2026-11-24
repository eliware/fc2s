import identifier from "./identifier.mjs";
import buildColumns from "./columns.mjs";

export default function buildTable(table, csv, rows) {
  const columns = buildColumns(rows);

  return {
    table,
    csv,
    columns,
    sql: `CREATE TABLE ${identifier(table)} (${columns.map((column) => `${column.mysqlName} ${column.mysqlType}${column.nullable ? "" : " NOT NULL"}`).join(", ")});\nLOAD DATA LOCAL INFILE ${JSON.stringify(csv)} INTO TABLE ${identifier(table)} FIELDS TERMINATED BY ',' ENCLOSED BY '"' LINES TERMINATED BY '\\r\\n' IGNORE 1 ROWS;`,
  };
}
