export function isHeader(record, columns) {
  return record.length === columns.length && record.every((name, index) => name === columns[index]);
}
