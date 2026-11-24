import { mockEffects } from "../../test-fixtures/mock-effects.mjs";

await mockEffects();
const buildColumns = (await import("../../src/schema/columns.mjs")).default;

test("column builder maps schema types and field names", () => {
  expect(
    buildColumns([
      ["APT", " IDENT,,, ", "4", "VARCHAR", "Yes"],
      ["APT", "COUNT", "0", "NUMBER", "No"],
      ["APT", "NOTE", "", "OTHER", "Yes"],
    ]),
  ).toEqual([
    { name: "IDENT", mysqlName: "`IDENT`", mysqlType: "VARCHAR(4)", nullable: true },
    { name: "COUNT", mysqlName: "`COUNT`", mysqlType: "DECIMAL(30,10)", nullable: false },
    { name: "NOTE", mysqlName: "`NOTE`", mysqlType: "TEXT", nullable: true },
  ]);
});

test("column builder uses a default size for invalid VARCHAR lengths", () => {
  expect(buildColumns([["APT", "ID", "", "VARCHAR", "Yes"]])[0].mysqlType).toBe("VARCHAR(255)");
});
