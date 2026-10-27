import {
  makeDirectory,
  mockEffects,
  putFile,
  removeTree,
} from "../../test-fixtures/mock-effects.mjs";

await mockEffects();
const { csvForTable, readSchemaFiles } = await import("../../src/schema/parser.mjs");

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

test("parser matches exact and unique prefixed CSV files only", () => {
  expect(csvForTable("TEST", ["TEST.csv", "TEST_extra.csv"])).toBe("TEST.csv");
  expect(csvForTable("TEST", ["TEST_extra.csv"])).toBe("TEST_extra.csv");
  expect(csvForTable("TEST", ["TEST_first.csv", "TEST_second.csv"])).toBeNull();
  expect(csvForTable("TEST", ["OTHER.csv"])).toBeNull();
});
