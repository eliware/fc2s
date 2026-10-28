import { mockEffects } from "../../test-fixtures/mock-effects.mjs";

await mockEffects();
const { sqlColumn } = await import("../../src/schema/column-identifier.mjs");

test("SQL column identifier trims CSV punctuation and quotes names", () => {
  expect(sqlColumn(" ID, ")).toBe("`ID`");
});

test("SQL column identifier rejects unsafe names", () => {
  expect(() => sqlColumn("bad-name")).toThrow("Unsafe column name");
});
