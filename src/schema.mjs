import readSchemaFiles from "./schema/parser.mjs";
import buildTables from "./schema/table-builder.mjs";

export default async function schema(dir) {
  const { files, dataFiles } = await readSchemaFiles(dir);
  if (!files.length) throw new Error(`No schema files in ${dir}`);

  return files.flatMap((file) => buildTables(dir, file, dataFiles));
}
