import { makeDirectory, mockEffects, putFile, removeTree } from "../test-fixtures/mock-effects.mjs";

await mockEffects();
const { identifier, schema } = await import("../src/schema.mjs");

test("validates identifiers", () => {
  expect(identifier("AIRPORT")).toBe("`AIRPORT`");
  expect(() => identifier("bad-name")).toThrow();
});

test("schema generates SQL for CSV schema and matching data", async () => {
  const directory = makeDirectory("schema");
  putFile(
    `${directory}/TEST_CSV_DATA_STRUCTURE.csv`,
    "CSV File,Field,Length,Type,Nullable\nTEST,ID,5,VARCHAR,Yes\nTEST,AMOUNT,,NUMBER,No\nTEST,NOTE,,TEXT,Yes\n",
  );
  putFile(`${directory}/TEST.csv`, "ID,AMOUNT,NOTE\n");
  const result = await schema(directory);
  expect(result).toHaveLength(1);
  expect(result[0].sql).toContain("VARCHAR(5)");
  expect(result[0].sql).toContain("DECIMAL(30,10) NOT NULL");
  removeTree(directory);
});

test("schema skips tables without data CSV", async () => {
  const directory = makeDirectory("schema-missing");
  putFile(
    `${directory}/X_CSV_DATA_STRUCTURE.csv`,
    "CSV File,Field,Length,Type,Nullable\nMISSING,ID,5,VARCHAR,Yes\n",
  );
  await expect(schema(directory)).resolves.toEqual([]);
  removeTree(directory);
});

test("schema rejects missing and malformed files and unsafe columns", async () => {
  const directory = makeDirectory("schema-invalid");
  await expect(schema(directory)).rejects.toThrow("No schema files");
  putFile(`${directory}/X_CSV_DATA_STRUCTURE.csv`, '"unterminated');
  await expect(schema(directory)).rejects.toThrow("Failed parsing");
  putFile(
    `${directory}/X_CSV_DATA_STRUCTURE.csv`,
    "CSV File,Field,Length,Type,Nullable\nX,bad-name,1,VARCHAR,Yes\n",
  );
  putFile(`${directory}/X.csv`, "x\n");
  await expect(schema(directory)).rejects.toThrow("Unsafe column name");
  removeTree(directory);
});

test("schema skips tables with ambiguous data CSV matches", async () => {
  const directory = makeDirectory("schema-ambiguous");
  putFile(
    `${directory}/X_CSV_DATA_STRUCTURE.csv`,
    "CSV File,Field,Length,Type,Nullable\nX,ID,5,VARCHAR,Yes\n",
  );
  putFile(`${directory}/X_first.csv`, "ID\n");
  putFile(`${directory}/X_second.csv`, "ID\n");
  await expect(schema(directory)).resolves.toEqual([]);
  removeTree(directory);
});

test("schema defaults invalid VARCHAR length to 255", async () => {
  const directory = makeDirectory("schema-length");
  putFile(
    `${directory}/X_CSV_DATA_STRUCTURE.csv`,
    "CSV File,Field,Length,Type,Nullable\nX,ID,,VARCHAR,Yes\n",
  );
  putFile(`${directory}/X.csv`, "ID\n");
  const result = await schema(directory);
  expect(result[0].sql).toContain("VARCHAR(255)");
  removeTree(directory);
});

test("schema uses a single prefixed data CSV match", async () => {
  const directory = makeDirectory("schema-prefix");
  putFile(
    `${directory}/X_CSV_DATA_STRUCTURE.csv`,
    "CSV File,Field,Length,Type,Nullable\nX,ID,5,VARCHAR,Yes\n",
  );
  putFile(`${directory}/X_extra.csv`, "ID\n");
  const result = await schema(directory);
  expect(result).toHaveLength(1);
  expect(result[0].sql).toContain("X_extra.csv");
  removeTree(directory);
});
