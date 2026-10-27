import { mockEffects, putFile } from "../test-fixtures/mock-effects.mjs";

await mockEffects();
const { db, listTables } = await import("../src/mysql.mjs");

test("db uses injected mysql client and stream factory", async () => {
  const connection = {};
  const createReadStream = (file) => file;
  const mysql = {
    createConnection: (options) => {
      connection.options = options;
      return connection;
    },
  };
  expect(
    db(
      { host: "h", port: 1, user: "u", password: "p", sslCa: "/ca.pem" },
      { mysql, createReadStream, readFileSync: () => "CA CERT" },
    ).options,
  ).toMatchObject({ host: "h", port: 1, user: "u", password: "p" });
  expect(connection.options.ssl).toEqual({
    ca: "CA CERT",
    rejectUnauthorized: true,
    verifyIdentity: true,
  });
  expect(connection.options.infileStreamFactory("x")).toBe("x");
});

test("db keeps TLS optional when no CA is configured", () => {
  const mysql = { createConnection: (options) => options };
  expect(db({ host: "h", port: 1, user: "u", password: "p" }, { mysql })).not.toHaveProperty("ssl");
});

test("db uses default read stream dependency", async () => {
  const mysql = { createConnection: (options) => options };
  putFile("/workspace/mysql-input", "input");
  const options = db(
    { host: "h", port: 1, user: "u", password: "p", sslCa: "/ca.pem" },
    { mysql, readFileSync: () => "CA" },
  );
  const stream = options.infileStreamFactory("/workspace/mysql-input");
  expect(stream).toBeDefined();
  stream.destroy();
});

test("db rejects with default mysql client when connection fails", async () => {
  await expect(
    db({ host: "127.0.0.1", port: 1, user: "invalid", password: "invalid" }),
  ).rejects.toBeDefined();
});

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
