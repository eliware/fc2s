import { Readable } from "node:stream";
import { mockEffects, putFile } from "../../test-fixtures/mock-effects.mjs";

await mockEffects();
const { readCsvRows } = await import("../../src/sqlite/csv-reader.mjs");

test("CSV reader skips its header and returns numbered rows", async () => {
  const rows = [];
  for await (const row of readCsvRows("/fixtures/input.csv", ["ID", "NAME"], {
    createReadStream: () => Readable.from(["ID,NAME\n001,Airport\n"]),
  })) {
    rows.push(row);
  }
  expect(rows).toEqual([{ record: ["001", "Airport"], rowNumber: 2 }]);
});

test("CSV reader keeps the first data row when the file has no header", async () => {
  const rows = [];
  for await (const row of readCsvRows("/fixtures/headerless.csv", ["ID", "NAME"], {
    createReadStream: () => Readable.from(["001,Airport\n002,Heliport\n"]),
  })) {
    rows.push(row);
  }
  expect(rows).toEqual([
    { record: ["001", "Airport"], rowNumber: 1 },
    { record: ["002", "Heliport"], rowNumber: 2 },
  ]);
});

test("CSV reader uses the default filesystem stream", async () => {
  putFile("/workspace/csv-reader.csv", "ID\n0007\n");
  const rows = [];
  for await (const row of readCsvRows("/workspace/csv-reader.csv", ["ID"])) rows.push(row);
  expect(rows).toEqual([{ record: ["0007"], rowNumber: 2 }]);
});

test("CSV reader rejects rows that do not match the field count", async () => {
  const rows = readCsvRows("/fixtures/bad.csv", ["A", "B"], {
    createReadStream: () => Readable.from(["A,B\nonly-one-field\n"]),
  });
  await expect(async () => {
    for await (const row of rows) void row;
  }).rejects.toThrow("Expected 2 fields, received 1");
});

test("CSV reader reports a stream failure", async () => {
  const failingStream = new Readable({
    read() {
      this.destroy(new Error("stream failed"));
    },
  });
  const rows = readCsvRows("/fixtures/input.csv", ["ID"], {
    createReadStream: () => failingStream,
  });
  await expect(async () => {
    for await (const row of rows) void row;
  }).rejects.toThrow("stream failed");
});

test("CSV reader records the header position when a stream fails after parsing", async () => {
  let sent = false;
  const source = new Readable({
    read() {
      if (sent) return;
      sent = true;
      this.push("ID\n001\n");
      queueMicrotask(() => this.destroy(new Error("late stream failure")));
    },
  });
  const rows = readCsvRows("/fixtures/input.csv", ["ID"], { createReadStream: () => source });
  await expect(async () => {
    for await (const row of rows) void row;
  }).rejects.toMatchObject({ rowNumber: 1 });
});
