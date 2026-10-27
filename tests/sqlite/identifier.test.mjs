import { mockEffects } from "../../test-fixtures/mock-effects.mjs";

await mockEffects();
const { quoteIdentifier } = await import("../../src/sqlite/identifier.mjs");

test("quotes safe table and column identifiers", () => {
  expect(quoteIdentifier("APT")).toBe('"APT"');
  expect(quoteIdentifier("AIRPORT NAME", true)).toBe('"AIRPORT NAME"');
});

test("rejects unsafe table and column identifiers", () => {
  expect(() => quoteIdentifier("BAD-NAME")).toThrow("Unsafe identifier");
  expect(() => quoteIdentifier("BAD-NAME", true)).toThrow("Unsafe column name");
});
