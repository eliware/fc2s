import dataUrl from "../src/data-url.mjs";

test("dataUrl formats an FAA date", () => {
  expect(dataUrl("2025-01-02")).toContain("02_Jan_2025_CSV.zip");
});

test.each(["nope", "2025-2-03", "2025-02-30"])("dataUrl rejects %s", (date) => {
  expect(() => dataUrl(date)).toThrow("Invalid date");
});
