import availableDates from "../src/fetch-faa.mjs";
import dataUrl from "../src/data-url.mjs";

test("availableDates uses FAA home page by default", async () => {
  const old = globalThis.fetch;
  globalThis.fetch = async (url) => {
    expect(url).toBe(
      "https://www.faa.gov/air_traffic/flight_info/aeronav/aero_data/NASR_Subscription/",
    );
    return {
      ok: true,
      text: async () =>
        "Subscription effective January 2, 2025; Subscription effective January 2, 2025; Subscription effective March 10, 2024; Subscription effective Fakemonth 31, 2025",
    };
  };
  await expect(availableDates()).resolves.toEqual(["2025-01-02", "2024-03-10"]);
  globalThis.fetch = old;
});

test("availableDates rejects HTTP errors", async () => {
  const old = globalThis.fetch;
  globalThis.fetch = async () => ({ ok: false, status: 500 });
  await expect(availableDates("x")).rejects.toThrow("FAA HTTP 500");
  globalThis.fetch = old;
});

test.each(["2025-02-30", "2025-2-03", "not-a-date"])(
  "dataUrl rejects invalid ISO calendar date %s",
  (date) => {
    expect(() => dataUrl(date)).toThrow("Invalid date");
  },
);
