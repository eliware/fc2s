import { createReadStream } from "node:fs";
import { parse } from "csv-parse";

export async function* readCsvRows(file, columns, deps = {}) {
  const createRead = deps.createReadStream ?? createReadStream;
  const source = createRead(file);
  const parser = parse({ bom: true, skip_empty_lines: true, relax_column_count: true });
  source.on("error", (error) => parser.destroy(error));
  let rowNumber = 0;

  try {
    for await (const record of source.pipe(parser)) {
      rowNumber += 1;
      const isHeader =
        record.length === columns.length && record.every((name, i) => name === columns[i]);
      if (rowNumber === 1 && isHeader) continue;
      if (record.length !== columns.length) {
        const error = new Error(`Expected ${columns.length} fields, received ${record.length}`);
        error.rowNumber = rowNumber;
        throw error;
      }
      yield { record, rowNumber };
    }
  } catch (error) {
    if (error.rowNumber === undefined && rowNumber > 0) error.rowNumber = rowNumber;
    throw error;
  }
}
