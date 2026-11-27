import { mockEffects } from "../../../test-fixtures/mock-effects.mjs";

await mockEffects();
const columnName = (await import("../../../src/schema/column/name.mjs")).default;

test("column name trims CSV punctuation", () => {
  expect(columnName(" ID, ")).toBe("ID");
});
