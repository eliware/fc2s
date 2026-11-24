import {
  makeDirectory,
  mockEffects,
  putFile,
  removeTree,
} from "../../test-fixtures/mock-effects.mjs";

await mockEffects();
const readSchemaFiles = (await import("../../src/schema/parser.mjs")).default;

test("parser reads schema CSV rows and trims their fields", async () => {
  const directory = makeDirectory("schema-parser");
  putFile(`${directory}/TEST_CSV_DATA_STRUCTURE.csv`, "CSV File, Field\n TEST , ID \n");
  putFile(`${directory}/TEST.csv`, "ID\n");

  const result = await readSchemaFiles(directory);
  expect(result.dataFiles).toEqual(["TEST.csv"]);
  expect(result.files[0].rows.map(({ record }) => record)).toEqual([
    ["CSV File", "Field"],
    ["TEST", "ID"],
  ]);
  removeTree(directory);
});

test("parser reports malformed schema CSV files", async () => {
  const directory = makeDirectory("schema-parser-invalid");
  putFile(`${directory}/TEST_CSV_DATA_STRUCTURE.csv`, '"unterminated');
  await expect(readSchemaFiles(directory)).rejects.toThrow("Failed parsing");
  removeTree(directory);
});
