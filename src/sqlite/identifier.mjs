import { identifier } from "../schema/identifier.mjs";

export function quoteIdentifier(value, isColumn = false) {
  if (isColumn) {
    if (!/^[A-Za-z_][A-Za-z0-9_ ]*$/.test(value)) throw new Error(`Unsafe column name: ${value}`);
  } else {
    identifier(value);
  }
  return `"${value.replaceAll('"', '""')}"`;
}
