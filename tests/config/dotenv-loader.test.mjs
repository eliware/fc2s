import { mockEffects } from "../../test-fixtures/mock-effects.mjs";

await mockEffects();
const loadDotenv = (await import("../../src/config/dotenv-loader.mjs")).default;

test("loadDotenv returns parsed values without changing process state", () => {
  let options;
  const configure = (receivedOptions) => {
    options = receivedOptions;
    receivedOptions.processEnv.FC2S_LOADER_TEST = "loaded";
    return { parsed: { FC2S_LOADER_TEST: "loaded" } };
  };
  expect(loadDotenv(configure)).toEqual({ FC2S_LOADER_TEST: "loaded" });
  expect(options.quiet).toBe(true);
  expect(options.processEnv.FC2S_LOADER_TEST).toBe("loaded");
  expect(process.env.FC2S_LOADER_TEST).toBeUndefined();
});

test("loadDotenv returns the configured environment when parsed values are absent", () => {
  const configure = ({ processEnv }) => {
    processEnv.FC2S_LOADER_FALLBACK = "loaded";
    return {};
  };
  expect(loadDotenv(configure)).toEqual({ FC2S_LOADER_FALLBACK: "loaded" });
});
