import sqlColumn from "./column/identifier.mjs";
import columnName from "./column/name.mjs";

export default function buildColumns(rows) {
  return rows.map((row) => {
    const name = columnName(row[1]);
    const type =
      row[3] === "VARCHAR"
        ? `VARCHAR(${Number(row[2]) || 255})`
        : row[3] === "NUMBER"
          ? "DECIMAL(30,10)"
          : "TEXT";
    return {
      name,
      mysqlName: sqlColumn(name),
      mysqlType: type,
      nullable: row[4] === "Yes",
    };
  });
}
