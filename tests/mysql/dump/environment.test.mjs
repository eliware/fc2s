import { mockEffects } from "../../../test-fixtures/mock-effects.mjs";

await mockEffects();
const { dumpEnvironment } = await import("../../../src/mysql/dump/environment.mjs");

test("dumpEnvironment clears inherited MySQL password variables", () => {
  const originalMysqlPassword = process.env.MYSQL_PWD;
  const originalMariaPassword = process.env.MARIADB_PWD;
  process.env.MYSQL_PWD = "mysql-secret";
  process.env.MARIADB_PWD = "maria-secret";
  try {
    const env = dumpEnvironment();
    expect(env.MYSQL_PWD).toBe("");
    expect(env.MARIADB_PWD).toBe("");
  } finally {
    if (originalMysqlPassword === undefined) delete process.env.MYSQL_PWD;
    else process.env.MYSQL_PWD = originalMysqlPassword;
    if (originalMariaPassword === undefined) delete process.env.MARIADB_PWD;
    else process.env.MARIADB_PWD = originalMariaPassword;
  }
});
