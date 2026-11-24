import sqlColumn from "./column-identifier.mjs";

export default function buildColumns(rows) {
  return rows.map((row) => {
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
}
