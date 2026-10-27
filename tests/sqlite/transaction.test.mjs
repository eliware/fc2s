import { mockEffects } from "../../test-fixtures/mock-effects.mjs";

await mockEffects();
const { transaction } = await import("../../src/sqlite/transaction.mjs");

test("transaction commits successful work and closes the database", async () => {
  const calls = [];
  const database = {
    exec: (statement) => calls.push(statement),
    close: () => calls.push("close"),
  };
  await expect(transaction(database, async () => "done")).resolves.toBe("done");
  expect(calls).toEqual([
    "PRAGMA journal_mode = DELETE; PRAGMA synchronous = FULL; BEGIN IMMEDIATE;",
    "COMMIT;",
    "close",
  ]);
});

test("transaction closes without rollback when begin fails", async () => {
  const calls = [];
  const database = {
    exec: (statement) => {
      calls.push(statement);
      throw new Error("begin failed");
    },
    close: () => calls.push("close"),
  };
  await expect(transaction(database, async () => {})).rejects.toThrow("begin failed");
  expect(calls).toEqual([
    "PRAGMA journal_mode = DELETE; PRAGMA synchronous = FULL; BEGIN IMMEDIATE;",
    "close",
  ]);
});

test("transaction rolls back failed work and preserves its error", async () => {
  const calls = [];
  const database = {
    exec: (statement) => {
      calls.push(statement);
      if (statement === "ROLLBACK;") throw new Error("rollback failed");
    },
    close: () => calls.push("close"),
  };
  await expect(
    transaction(database, async () => {
      throw new Error("work failed");
    }),
  ).rejects.toThrow("work failed");
  expect(calls).toEqual([
    "PRAGMA journal_mode = DELETE; PRAGMA synchronous = FULL; BEGIN IMMEDIATE;",
    "ROLLBACK;",
    "close",
  ]);
});
