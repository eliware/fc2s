import formatDates from "../src/format-dates.mjs";

test("formatDates labels preview and current dates", () => {
  expect(formatDates(["2026-10-29", "2026-10-01", "2026-09-03"])).toBe(
    "2026-10-29 (preview)\n2026-10-01 (current)\n2026-09-03",
  );
  expect(formatDates(["2026-10-29"])).toBe("2026-10-29 (preview)");
});
