import quoteIdentifier from "../identifier.mjs";
import tableDefinition from "./definition.mjs";

export default function createTableWriter(database, table) {
  const names = table.columns.map((column) => quoteIdentifier(column.name, true));
  database.exec(tableDefinition(table));
  return database.prepare(
    `INSERT INTO ${quoteIdentifier(table.table)} (${names.join(", ")}) VALUES (${names.map(() => "?").join(", ")})`,
  );
}
