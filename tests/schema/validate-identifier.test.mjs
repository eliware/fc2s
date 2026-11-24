import validateIdentifier from "../../src/schema/validate-identifier.mjs";

test("validateIdentifier returns safe names and rejects unsafe names", () => {
  expect(validateIdentifier("AIRPORT")).toBe("AIRPORT");
  expect(() => validateIdentifier("bad-name")).toThrow("Unsafe identifier");
});
