import { mockEffects } from "../test-fixtures/mock-effects.mjs";

await mockEffects();
const { db, listTables } = await import("../src/mysql.mjs");

test("MySQL facade exposes connection and table-list operations", async () => {
  const connection = {
    query: async () => [[{ Tables_in_nasr: "APT" }]],
    end: async () => {},
  };
  const mysql = { createConnection: () => connection };
  const config = { host: "h", port: 1, user: "u", password: "p" };
  expect(db(config, { mysql })).toBe(connection);
  await expect(listTables(config, "nasr", { mysql })).resolves.toEqual(["APT"]);
});
