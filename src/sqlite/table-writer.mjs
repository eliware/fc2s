import { quoteIdentifier } from "./identifier.mjs";

export function createTableWriter(database, table) {
  const names = table.columns.map((column) => quoteIdentifier(column.name, true));
  const definitions = table.columns.map(
    (column, index) => `${names[index]} TEXT${column.nullable ? "" : " NOT NULL"}`,
  );
  database.exec(`CREATE TABLE ${quoteIdentifier(table.table)} (${definitions.join(", ")});`);
  return database.prepare(
    `INSERT INTO ${quoteIdentifier(table.table)} (${names.join(", ")}) VALUES (${names.map(() => "?").join(", ")})`,
  );
}
