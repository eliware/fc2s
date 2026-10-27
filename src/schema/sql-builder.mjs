import { identifier } from "./identifier.mjs";

export { identifier } from "./identifier.mjs";

function sqlColumn(value) {
  const column = value.trim().replace(/,+$/, "").trim();
  if (!/^[A-Za-z_][A-Za-z0-9_ ]*$/.test(column)) {
    throw new Error(`Unsafe column name: ${column}`);
  }
  return `\`${column.replaceAll("`", "``")}\``;
}

export function buildTable(table, csv, rows) {
  const columns = rows.map((row) => {
    const type =
      row[3] === "VARCHAR"
        ? `VARCHAR(${Number(row[2]) || 255})`
        : row[3] === "NUMBER"
          ? "DECIMAL(30,10)"
          : "TEXT";
    return {
      name: row[1].trim().replace(/,+$/, "").trim(),
      mysqlName: sqlColumn(row[1]),
      mysqlType: type,
      nullable: row[4] === "Yes",
    };
  });

  return {
    table,
    csv,
    columns,
    sql: `CREATE TABLE ${identifier(table)} (${columns.map((column) => `${column.mysqlName} ${column.mysqlType}${column.nullable ? "" : " NOT NULL"}`).join(", ")});\nLOAD DATA LOCAL INFILE ${JSON.stringify(csv)} INTO TABLE ${identifier(table)} FIELDS TERMINATED BY ',' ENCLOSED BY '"' LINES TERMINATED BY '\\r\\n' IGNORE 1 ROWS;`,
  };
}
