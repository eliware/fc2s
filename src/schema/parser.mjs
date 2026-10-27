import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { parse } from "csv-parse/sync";
import { log } from "../debug.mjs";

export function csvForTable(table, dataFiles) {
  const exact = `${table}.csv`;
  if (dataFiles.includes(exact)) return exact;
  const matches = dataFiles.filter((name) => name.startsWith(`${table}_`));
  return matches.length === 1 ? matches[0] : null;
}

export async function readSchemaFiles(dir) {
  const entries = await readdir(dir);
  const filenames = entries.filter((name) => name.endsWith("_CSV_DATA_STRUCTURE.csv"));
  const dataFiles = entries.filter(
    (name) => name.endsWith(".csv") && !name.endsWith("_CSV_DATA_STRUCTURE.csv"),
  );
  log("schema files", { dir, files: filenames });

  const files = [];
  for (const filename of filenames) {
    const file = path.join(dir, filename);
    const raw = await readFile(file);
    log("parsing schema", { file, bytes: raw.length });
    try {
      const rows = parse(raw.toString().replace(/\r\n?/g, "\n"), {
        skip_empty_lines: true,
        info: true,
      });
      files.push({
        file,
        rows: rows.map((item) => ({ ...item, record: item.record.map((value) => value.trim()) })),
      });
    } catch (error) {
      log("schema parse error", {
        file,
        line: error.lines,
        record: error.record,
        code: error.code,
        message: error.message,
      });
      throw new Error(`Failed parsing ${file}: ${error.message}`, { cause: error });
    }
  }
  return { files, dataFiles };
}
