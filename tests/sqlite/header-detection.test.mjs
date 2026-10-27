import { mockEffects } from "../../test-fixtures/mock-effects.mjs";

await mockEffects();
const { isHeader } = await import("../../src/sqlite/header-detection.mjs");

test("header detection requires the expected names and field count", () => {
  expect(isHeader(["ID", "NAME"], ["ID", "NAME"])).toBe(true);
  expect(isHeader(["ID"], ["ID", "NAME"])).toBe(false);
  expect(isHeader(["ID", "LABEL"], ["ID", "NAME"])).toBe(false);
});
