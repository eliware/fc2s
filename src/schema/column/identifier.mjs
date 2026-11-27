export default function sqlColumn(value) {
  if (!/^[A-Za-z_][A-Za-z0-9_ ]*$/.test(value)) {
    throw new Error(`Unsafe column name: ${value}`);
  }
  return `\`${value.replaceAll("`", "``")}\``;
}
