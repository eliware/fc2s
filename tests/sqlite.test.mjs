import { Readable } from "node:stream";
import { DatabaseSync } from "node:sqlite";
import { makeDirectory, mockEffects, putFile, removeTree } from "../test-fixtures/mock-effects.mjs";

await mockEffects();
const { importSqlite } = await import("../src/sqlite.mjs");

function inMemoryDatabase() {
  const database = new DatabaseSync(":memory:");
  return {
    database,
    factory: class {
      constructor() {
        return {
          exec: (statement) => database.exec(statement),
          prepare: (statement) => database.prepare(statement),
          close: () => {},
        };
      }
    },
  };
}

test("imports CSV rows into SQLite and keeps source values as text", async () => {
  const { database, factory } = inMemoryDatabase();
  await importSqlite(
    ":memory:",
    [
      {
        table: "APT",
        csv: "/fixtures/APT.csv",
        columns: [
          { name: "IDENT", nullable: false },
          { name: "VALUE", nullable: true },
          { name: "NOTE", nullable: true },
        ],
      },
    ],
    {
      DatabaseSync: factory,
      createReadStream: () =>
        Readable.from([
          'IDENT,VALUE,NOTE\n00123,123,"quoted, value"\n00008,9.25,"line one\nline two"\n',
        ]),
    },
  );
  expect(database.prepare("SELECT * FROM APT ORDER BY rowid").all()).toEqual([
    { IDENT: "00123", VALUE: "123", NOTE: "quoted, value" },
    { IDENT: "00008", VALUE: "9.25", NOTE: "line one\nline two" },
  ]);
  expect(database.prepare("PRAGMA table_info(APT)").all()[0].notnull).toBe(1);
  database.close();
});

test("rejects CSV rows that do not match the schema field count", async () => {
  const { database, factory } = inMemoryDatabase();
  await expect(
    importSqlite(
      ":memory:",
      [
        {
          table: "BAD",
          csv: "/fixtures/bad.csv",
          columns: [
            { name: "A", nullable: true },
            { name: "B", nullable: true },
          ],
        },
      ],
      { DatabaseSync: factory, createReadStream: () => Readable.from(["A,B\nonly-one-field\n"]) },
    ),
  ).rejects.toThrow("Expected 2 fields, received 1");
  database.close();
});

test("uses default SQLite and stream dependencies with an in-memory database", async () => {
  await expect(importSqlite(":memory:", [])).resolves.toBeUndefined();

  const root = makeDirectory("sqlite-default-stream");
  const csv = `${root}/source.csv`;
  putFile(csv, "ID\n0007\n");
  const { database, factory } = inMemoryDatabase();
  await importSqlite(
    ":memory:",
    [{ table: "APT", csv, columns: [{ name: "ID", nullable: false }] }],
    { DatabaseSync: factory },
  );
  expect(database.prepare("SELECT ID FROM APT").all()).toEqual([{ ID: "0007" }]);
  database.close();
  removeTree(root);
});

test("rejects unsafe columns and skips rollback when transaction start fails", async () => {
  const { database, factory } = inMemoryDatabase();
  await expect(
    importSqlite(
      ":memory:",
      [{ table: "APT", csv: "/fixtures/a.csv", columns: [{ name: "BAD-NAME", nullable: true }] }],
      { DatabaseSync: factory, createReadStream: () => Readable.from([]) },
    ),
  ).rejects.toThrow("Unsafe column name");
  database.close();

  class FailingDatabase {
    exec() {
      throw new Error("transaction failed");
    }
    close() {}
  }
  await expect(importSqlite(":memory:", [], { DatabaseSync: FailingDatabase })).rejects.toThrow(
    "transaction failed",
  );
});

test("reports a stream failure before the first CSV record", async () => {
  const { database, factory } = inMemoryDatabase();
  const failingStream = new Readable({
    read() {
      this.destroy(new Error("stream failed"));
    },
  });
  await expect(
    importSqlite(
      ":memory:",
      [{ table: "APT", csv: "/fixtures/a.csv", columns: [{ name: "ID", nullable: true }] }],
      { DatabaseSync: factory, createReadStream: () => failingStream },
    ),
  ).rejects.toThrow("Failed importing APT from /fixtures/a.csv: stream failed");
  database.close();
});
