import { mockEffects } from "../../test-fixtures/mock-effects.mjs";

await mockEffects();
const { buildTable, identifier } = await import("../../src/schema/sql-builder.mjs");

test("identifier accepts safe names and rejects unsafe names", () => {
  expect(identifier("AIRPORT")).toBe("`AIRPORT`");
  expect(() => identifier("bad-name")).toThrow("Unsafe identifier");
});

test("builder creates MySQL columns and data-loading SQL", () => {
  const result = buildTable("AIRPORT", "/data/AIRPORT.csv", [
    ["AIRPORT", "ID", "5", "VARCHAR", "Yes"],
    ["AIRPORT", "AMOUNT", "", "NUMBER", "No"],
    ["AIRPORT", "NOTE", "", "TEXT", "Yes"],
  ]);
  expect(result.columns).toEqual([
    { name: "ID", mysqlName: "`ID`", mysqlType: "VARCHAR(5)", nullable: true },
    { name: "AMOUNT", mysqlName: "`AMOUNT`", mysqlType: "DECIMAL(30,10)", nullable: false },
    { name: "NOTE", mysqlName: "`NOTE`", mysqlType: "TEXT", nullable: true },
  ]);
  expect(result.sql).toContain("CREATE TABLE `AIRPORT`");
  expect(result.sql).toContain('LOAD DATA LOCAL INFILE "/data/AIRPORT.csv"');
  expect(result.sql).toContain("DECIMAL(30,10) NOT NULL");
});

test("builder defaults invalid VARCHAR lengths and rejects unsafe columns", () => {
  expect(buildTable("X", "X.csv", [["X", "ID", "", "VARCHAR", "Yes"]]).sql).toContain(
    "VARCHAR(255)",
  );
  expect(() => buildTable("X", "X.csv", [["X", "bad-name", "1", "VARCHAR", "Yes"]])).toThrow(
    "Unsafe column name",
  );
});
