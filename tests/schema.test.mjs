import { makeDirectory, mockEffects, putFile, removeTree } from "../test-fixtures/mock-effects.mjs";

await mockEffects();
const { schema } = await import("../src/schema.mjs");

test("schema assembles parsed fields and generated SQL for a matching CSV", async () => {
  const directory = makeDirectory("schema-integration");
  putFile(
    `${directory}/TEST_CSV_DATA_STRUCTURE.csv`,
    "CSV File,Field,Length,Type,Nullable\nTEST,ID,5,VARCHAR,Yes\nTEST,AMOUNT,,NUMBER,No\nTEST,NOTE,,TEXT,Yes\n",
  );
  putFile(`${directory}/TEST.csv`, "ID,AMOUNT,NOTE\n");

  const result = await schema(directory);
  expect(result).toHaveLength(1);
  expect(result[0]).toMatchObject({ table: "TEST", csv: `${directory}/TEST.csv` });
  expect(result[0].columns).toEqual([
    { name: "ID", mysqlName: "`ID`", mysqlType: "VARCHAR(5)", nullable: true },
    { name: "AMOUNT", mysqlName: "`AMOUNT`", mysqlType: "DECIMAL(30,10)", nullable: false },
    { name: "NOTE", mysqlName: "`NOTE`", mysqlType: "TEXT", nullable: true },
  ]);
  expect(result[0].sql).toContain("VARCHAR(5)");
  expect(result[0].sql).toContain("DECIMAL(30,10) NOT NULL");
  removeTree(directory);
});

test("schema reports missing structure files and skips tables without a data CSV", async () => {
  const empty = makeDirectory("schema-empty");
  await expect(schema(empty)).rejects.toThrow(`No schema files in ${empty}`);
  removeTree(empty);

  const missingData = makeDirectory("schema-no-data");
  putFile(
    `${missingData}/TEST_CSV_DATA_STRUCTURE.csv`,
    "CSV File,Field,Length,Type,Nullable\nTEST,ID,5,VARCHAR,Yes\n",
  );
  await expect(schema(missingData)).resolves.toEqual([]);
  removeTree(missingData);
});
