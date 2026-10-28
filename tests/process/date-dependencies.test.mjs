import { mockEffects } from "../../test-fixtures/mock-effects.mjs";

await mockEffects();
const { dateDependencies } = await import("../../src/process/date-dependencies.mjs");

test("date dependencies provide FAA date lookup separately", () => {
  expect(typeof dateDependencies.availableDates).toBe("function");
});
