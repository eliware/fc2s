import { mockEffects } from "../../../test-fixtures/mock-effects.mjs";

await mockEffects();
const { listTables } = await import("../../../src/mysql/table/list.mjs");

test("listTables queries and closes the configured database connection", async () => {
  const calls = [];
  const connection = {
    query: async (query) => {
      calls.push(query);
      return [[{ Tables_in_nasr: "APT" }, { Tables_in_nasr: "NAV" }]];
    },
    end: async () => calls.push("closed"),
  };
  const mysql = { createConnection: () => connection };
  await expect(
    listTables({ host: "h", port: 1, user: "u", password: "p" }, "nasr", { mysql }),
  ).resolves.toEqual(["APT", "NAV"]);
  expect(calls).toEqual(["SHOW TABLES FROM `nasr`", "closed"]);
});

test("listTables rejects unsafe database names before connecting", async () => {
  const mysql = {
    createConnection: () => {
      throw new Error("should not connect");
    },
  };
  await expect(listTables({}, "bad-name", { mysql })).rejects.toThrow("Unsafe database name");
});

test("listTables uses the default database dependencies", async () => {
  await expect(
    listTables({ host: "127.0.0.1", port: 1, user: "invalid", password: "invalid" }, "nasr"),
  ).rejects.toBeDefined();
});
