import quoteIdentifier from "../identifier.mjs";

export default function tableDefinition(table) {
  const names = table.columns.map((column) => quoteIdentifier(column.name, true));
  const definitions = table.columns.map(
    (column, index) => `${names[index]} TEXT${column.nullable ? "" : " NOT NULL"}`,
  );
  return `CREATE TABLE ${quoteIdentifier(table.table)} (${definitions.join(", ")});`;
}
