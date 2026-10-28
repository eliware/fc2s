import { mockEffects } from "../../test-fixtures/mock-effects.mjs";

await mockEffects();
const { identifier, validateIdentifier } = await import("../../src/schema/identifier.mjs");

test("identifier accepts safe names and rejects unsafe names", () => {
  expect(identifier("AIRPORT")).toBe("`AIRPORT`");
  expect(validateIdentifier("AIRPORT")).toBe("AIRPORT");
  expect(() => identifier("bad-name")).toThrow("Unsafe identifier");
  expect(() => validateIdentifier("bad-name")).toThrow("Unsafe identifier");
});
