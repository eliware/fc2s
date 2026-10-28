import { identifier } from "../schema/identifier.mjs";
import { validateColumnIdentifier } from "./column-identifier.mjs";

export function quoteIdentifier(value, isColumn = false) {
  if (isColumn) validateColumnIdentifier(value);
  else identifier(value);
  return `"${value.replaceAll('"', '""')}"`;
}
