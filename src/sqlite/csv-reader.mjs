import { createReadStream } from "node:fs";
import { parse } from "csv-parse";

export async function* readCsvRows(file, fieldCount, deps = {}) {
  const createRead = deps.createReadStream ?? createReadStream;
  const source = createRead(file);
  const parser = parse({ bom: true, skip_empty_lines: true, relax_column_count: true });
  source.on("error", (error) => parser.destroy(error));
  let rowNumber = 0;

  try {
    for await (const record of source.pipe(parser)) {
      rowNumber += 1;
      if (rowNumber === 1) continue;
      if (record.length !== fieldCount) {
        const error = new Error(`Expected ${fieldCount} fields, received ${record.length}`);
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
