import { mockEffects } from "../../test-fixtures/mock-effects.mjs";

await mockEffects();
const { validateColumnIdentifier } = await import("../../src/sqlite/column-identifier.mjs");

test("column identifier validation accepts safe names and returns them", () => {
  expect(validateColumnIdentifier("AIRPORT NAME")).toBe("AIRPORT NAME");
});

test("column identifier validation rejects unsafe names", () => {
  expect(() => validateColumnIdentifier("BAD-NAME")).toThrow("Unsafe column name");
});
