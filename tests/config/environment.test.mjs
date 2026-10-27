import { mockEffects } from "../../test-fixtures/mock-effects.mjs";

await mockEffects();
const { loadEnvironment } = await import("../../src/config/environment.mjs");

test("loadEnvironment exposes the populated process environment", () => {
  expect(loadEnvironment()).toBe(process.env);
});
