export default function csvForTable(table, dataFiles) {
  const exact = `${table}.csv`;
  if (dataFiles.includes(exact)) return exact;
  const matches = dataFiles.filter((name) => name.startsWith(`${table}_`));
  return matches.length === 1 ? matches[0] : null;
}
