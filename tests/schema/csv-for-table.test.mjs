import csvForTable from "../../src/schema/csv-for-table.mjs";

test("csvForTable matches exact and unique prefixed files", () => {
  expect(csvForTable("TEST", ["TEST.csv", "TEST_extra.csv"])).toBe("TEST.csv");
  expect(csvForTable("TEST", ["TEST_extra.csv"])).toBe("TEST_extra.csv");
  expect(csvForTable("TEST", ["TEST_first.csv", "TEST_second.csv"])).toBeNull();
  expect(csvForTable("TEST", ["OTHER.csv"])).toBeNull();
});
