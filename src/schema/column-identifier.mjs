export function sqlColumn(value) {
  const column = value.trim().replace(/,+$/, "").trim();
  if (!/^[A-Za-z_][A-Za-z0-9_ ]*$/.test(column)) {
    throw new Error(`Unsafe column name: ${column}`);
  }
  return `\`${column.replaceAll("`", "``")}\``;
}
