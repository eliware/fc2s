import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { parse } from 'csv-parse/sync';
import { log } from './debug.mjs';

const id = /^[A-Za-z_][A-Za-z0-9_]*$/;

export function identifier(value) {
  if (!id.test(value)) throw new Error(`Unsafe identifier: ${value}`);
  return `\`${value}\``;
}

function sqlColumn(value) {
  const column = value.trim().replace(/,+$/, '').trim();
  if (!/^[A-Za-z_][A-Za-z0-9_ ]*$/.test(column)) {
    throw new Error(`Unsafe column name: ${column}`);
  }
  return `\`${column.replaceAll('`', '``')}\``;
}

export async function schema(dir) {
  const entries = await readdir(dir);
  const files = entries.filter((name) => name.endsWith('_CSV_DATA_STRUCTURE.csv'));
  const dataFiles = entries.filter(
    (name) => name.endsWith('.csv') && !name.endsWith('_CSV_DATA_STRUCTURE.csv'),
  );
  const csvFor = (table) => {
    const exact = `${table}.csv`;
    if (dataFiles.includes(exact)) return exact;
    const matches = dataFiles.filter((name) => name.startsWith(`${table}_`));
    return matches.length === 1 ? matches[0] : null;
  };

  log('schema files', { dir, files });
  if (!files.length) throw new Error(`No schema files in ${dir}`);

  const result = [];
  for (const filename of files) {
    const file = path.join(dir, filename);
    const raw = await readFile(file);
    log('parsing schema', { file, bytes: raw.length });
    let rows;
    try {
      rows = parse(raw.toString().replace(/\r\n?/g, '\n'), {
        skip_empty_lines: true,
        info: true,
      });
    } catch (error) {
      log('schema parse error', {
        file,
        line: error.lines,
        record: error.record,
        code: error.code,
        message: error.message,
      });
      throw new Error(`Failed parsing ${file}: ${error.message}`, { cause: error });
    }

    let table;
    let columns = [];
    const flush = () => {
      if (!table || !columns.length) return;
      const name = csvFor(table);
      if (!name) {
        log('skipping schema table without CSV', { table });
        return;
      }
      const csv = path.join(dir, name);
      result.push({
        table,
        sql: `CREATE TABLE ${identifier(table)} (${columns.join(', ')});\nLOAD DATA LOCAL INFILE ${JSON.stringify(csv)} INTO TABLE ${identifier(table)} FIELDS TERMINATED BY ',' ENCLOSED BY '"' LINES TERMINATED BY '\\r\\n' IGNORE 1 ROWS;`,
      });
      log('schema table', { table, columns: columns.length, csv });
    };

    for (const item of rows) {
      const row = item.record.map((value) => value.trim());
      log('schema row', { file, line: item.info.lines, fields: row.length, first: row[0] });
      if (row.every((value) => value === '') || row[0] === 'CSV File') continue;
      if (row[0] !== table) {
        flush();
        table = row[0];
        columns = [];
      }
      const type = row[3] === 'VARCHAR'
        ? `VARCHAR(${Number(row[2]) || 255})`
        : row[3] === 'NUMBER' ? 'DECIMAL(30,10)' : 'TEXT';
      columns.push(`${sqlColumn(row[1])} ${type}${row[4] === 'Yes' ? '' : ' NOT NULL'}`);
    }
    flush();
  }
  return result;
}
