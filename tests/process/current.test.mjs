import { jest } from "@jest/globals";
import runProcess from "../../src/process/current.mjs";

test("current process selects the second newest date", async () => {
  const processDate = jest.fn(async (date) => date);
  await expect(
    runProcess(
      "current",
      {},
      {
        availableDates: async () => ["2025-03-01", "2025-02-01", "2025-01-01"],
        processDate,
      },
    ),
  ).resolves.toEqual(["2025-02-01"]);
});
