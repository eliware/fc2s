import { mockEffects } from "../../../test-fixtures/mock-effects.mjs";

await mockEffects();
const tableDefinition = (await import("../../../src/sqlite/table/definition.mjs")).default;

test("table definition preserves nullable and required text columns", () => {
  expect(
    tableDefinition({
      table: "APT",
      columns: [
        { name: "IDENT", nullable: false },
        { name: "NOTE", nullable: true },
      ],
    }),
  ).toBe('CREATE TABLE "APT" ("IDENT" TEXT NOT NULL, "NOTE" TEXT);');
});
