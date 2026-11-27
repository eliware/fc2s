import path from "node:path";
import { mockEffects } from "../../test-fixtures/mock-effects.mjs";

await mockEffects();
const buildTables = (await import("../../src/schema/table-builder.mjs")).default;

test("buildTables groups fields and selects matching CSV files", () => {
  const parsed = {
    file: "/data/structure.csv",
    rows: [
      { record: ["CSV File"], info: { lines: 1 } },
      { record: ["APT", "ID", "5", "VARCHAR", "Yes"], info: { lines: 2 } },
      { record: ["MISSING", "NAME", "", "TEXT", "Yes"], info: { lines: 3 } },
    ],
  };

  const result = buildTables("/data", parsed, ["APT.csv"]);
  expect(result).toHaveLength(1);
  expect(result[0]).toMatchObject({ table: "APT", csv: path.join("/data", "APT.csv") });
});
