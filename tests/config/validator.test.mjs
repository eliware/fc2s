import { mockEffects } from "../../test-fixtures/mock-effects.mjs";

await mockEffects();
const { validateConfig } = await import("../../src/config/validator.mjs");

test("validator accepts supported drivers and returns the settings", () => {
  const sqlite = { driver: "sqlite" };
  const mysql = { driver: "mysql", host: "h", user: "u", password: "p", port: 3306 };
  expect(validateConfig(sqlite)).toBe(sqlite);
  expect(validateConfig(mysql)).toBe(mysql);
});

test("validator rejects unsupported drivers", () => {
  expect(() => validateConfig({ driver: "postgres" })).toThrow(
    "Unsupported database driver: postgres",
  );
});

test.each([Number.NaN, 0, 65536])("validator rejects invalid MySQL port %s", (port) => {
  expect(() =>
    validateConfig({ driver: "mysql", host: "h", user: "u", password: "p", port }),
  ).toThrow(`Invalid MYSQL_PORT: ${port}`);
});
