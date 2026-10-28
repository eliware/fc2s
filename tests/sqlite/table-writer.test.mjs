import { mockEffects } from "../../test-fixtures/mock-effects.mjs";

await mockEffects();
const { createTableWriter } = await import("../../src/sqlite/table-writer.mjs");

test("table writer creates a schema and prepares the insert statement", () => {
  const calls = [];
  const insert = {};
  const database = {
    exec: (sql) => calls.push(["exec", sql]),
    prepare: (sql) => {
      calls.push(["prepare", sql]);
      return insert;
    },
  };
  const writer = createTableWriter(database, {
    table: "APT",
    columns: [
      { name: "IDENT", nullable: false },
      { name: "NOTE", nullable: true },
    ],
  });
  expect(writer).toBe(insert);
  expect(calls).toEqual([
    ["exec", 'CREATE TABLE "APT" ("IDENT" TEXT NOT NULL, "NOTE" TEXT);'],
    ["prepare", 'INSERT INTO "APT" ("IDENT", "NOTE") VALUES (?, ?)'],
  ]);
});
