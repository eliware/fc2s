import { EventEmitter } from "node:events";
import { mockEffects, putFile } from "../test-fixtures/mock-effects.mjs";

await mockEffects();
const { db, dumpTable } = await import("../src/mysql.mjs");

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

test("mysql facade delegates table dumping", async () => {
  let command;
  await dumpTable({ host: "h", port: 1, user: "u", password: "p" }, "d", "t", "x", {
    spawn: (name) => {
      command = name;
      const child = new EventEmitter();
      child.stdin = { end: () => {} };
      child.stdout = new EventEmitter();
      child.stderr = new EventEmitter();
      queueMicrotask(() => child.emit("close", 0));
      return child;
    },
    pipeline: async () => {},
    createWriteStream: () => ({}),
  });
  expect(command).toBe("mysqldump");
});
