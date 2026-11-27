import availableDates from "../src/fetch-faa.mjs";

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
