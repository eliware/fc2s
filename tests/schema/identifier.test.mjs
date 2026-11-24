import { mockEffects } from "../../test-fixtures/mock-effects.mjs";

await mockEffects();
const identifier = (await import("../../src/schema/identifier.mjs")).default;
const validateIdentifier = (await import("../../src/schema/validate-identifier.mjs")).default;

test("identifier accepts safe names and rejects unsafe names", () => {
  expect(identifier("AIRPORT")).toBe("`AIRPORT`");
  expect(validateIdentifier("AIRPORT")).toBe("AIRPORT");
  expect(() => identifier("bad-name")).toThrow("Unsafe identifier");
  expect(() => validateIdentifier("bad-name")).toThrow("Unsafe identifier");
});
