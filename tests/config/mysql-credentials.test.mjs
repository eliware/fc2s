import { mockEffects } from "../../test-fixtures/mock-effects.mjs";

await mockEffects();
const { validateMysqlCredentials } = await import("../../src/config/mysql-credentials.mjs");

test.each([
  ["host", "HOSTNAME"],
  ["user", "USERNAME"],
  ["password", "PASSWORD"],
])("credential validation requires %s", (key, envKey) => {
  expect(() =>
    validateMysqlCredentials({ host: "h", user: "u", password: "p", [key]: undefined }),
  ).toThrow(`Missing MYSQL_${envKey}`);
});

test("credential validation accepts complete settings", () => {
  expect(() => validateMysqlCredentials({ host: "h", user: "u", password: "p" })).not.toThrow();
});
