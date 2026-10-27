import { mockEffects } from "../../test-fixtures/mock-effects.mjs";

await mockEffects();
const { validateConfig } = await import("../../src/config/validator.mjs");

test("validator accepts supported drivers and returns the settings", () => {
  const sqlite = { driver: "sqlite" };
  const mysql = { driver: "mysql", host: "h", user: "u", password: "p" };
  expect(validateConfig(sqlite)).toBe(sqlite);
  expect(validateConfig(mysql)).toBe(mysql);
});

test("validator rejects unsupported drivers and missing MySQL credentials", () => {
  expect(() => validateConfig({ driver: "postgres" })).toThrow(
    "Unsupported database driver: postgres",
  );
  expect(() => validateConfig({ driver: "mysql", host: "h", user: "u" })).toThrow(
    "Missing MYSQL_PASSWORD",
  );
});
