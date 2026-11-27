import { mockEffects } from "../../test-fixtures/mock-effects.mjs";

await mockEffects();
const loadDotenv = (await import("../../src/config/dotenv-loader.mjs")).default;

test("loadDotenv loads environment values once", () => {
  let calls = 0;
  let options;
  const configure = (receivedOptions) => {
    calls++;
    options = receivedOptions;
  };
  loadDotenv(configure);
  loadDotenv(configure);
  expect(calls).toBe(1);
  expect(options).toEqual({ quiet: true });
});
