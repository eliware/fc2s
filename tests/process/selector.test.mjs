import { mockEffects } from "../../test-fixtures/mock-effects.mjs";

await mockEffects();
const { createProcess } = await import("../../src/process/selector.mjs");

test("process selector selects latest, current, and all dates", async () => {
  const calls = [];
  let active = 0;
  let maxActive = 0;
  const process = createProcess(undefined, {
    availableDates: async () => ["2025-03-01", "2025-02-01", "2025-01-01"],
  });
  const dependencies = {
    processDate: async (date) => {
      active += 1;
      maxActive = Math.max(maxActive, active);
      calls.push(date);
      await Promise.resolve();
      active -= 1;
      return date;
    },
  };
  await expect(process("latest", {}, dependencies)).resolves.toEqual(["2025-03-01"]);
  await expect(process("current", {}, dependencies)).resolves.toEqual(["2025-02-01"]);
  await expect(process("all", {}, dependencies)).resolves.toEqual([
    "2025-01-01",
    "2025-02-01",
    "2025-03-01",
  ]);
  expect(calls).toHaveLength(5);
  expect(maxActive).toBe(1);
});

test("process selector rejects an empty date list", async () => {
  const process = createProcess(undefined, { availableDates: async () => [] });
  await expect(process()).rejects.toThrow("No FAA dates");
});

test("process selector rejects unsupported modes before loading dates", async () => {
  let dateLookups = 0;
  const availableDates = async () => {
    dateLookups += 1;
    return ["2025-01-01"];
  };
  const process = createProcess(undefined, { availableDates });
  await expect(process("curent")).rejects.toThrow("Unsupported process mode: curent");
  expect(dateLookups).toBe(0);
});

test("process selector defaults to processing dates with provided overrides", async () => {
  const calls = [];
  const defaults = { availableDates: async () => ["2025-01-02"] };
  const processDate = async (date, overrides, dependencies) => {
    calls.push({ date, overrides, dependencies });
    return date;
  };
  const process = createProcess(processDate, defaults);
  await expect(process(undefined, { driver: "sqlite" })).resolves.toEqual(["2025-01-02"]);
  expect(calls).toEqual([
    { date: "2025-01-02", overrides: { driver: "sqlite" }, dependencies: defaults },
  ]);
});
