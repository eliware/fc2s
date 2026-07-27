import { HOME_PAGE, availableDates, dataUrl, parseDates } from '../src/fetch-faa.mjs';

test('parseDates returns unique newest-first ISO dates', () => {
  expect(parseDates('Preview: January 2, 2025; January 2, 2025; March 10, 2024'))
    .toEqual(['2025-01-02', '2024-03-10']);
});
test('parseDates ignores invalid calendar dates', () => {
  expect(parseDates('Fakemonth 31, 2025')).toEqual([]);
});

test('dataUrl formats FAA date', () => {
  expect(dataUrl('2025-01-02')).toContain('02_Jan_2025_CSV.zip');
});
test('dataUrl rejects invalid date', () => {
  expect(() => dataUrl('nope')).toThrow('Invalid date');
});

test('availableDates fetches and parses page', async () => {
  const old = globalThis.fetch;
  globalThis.fetch = async () => ({ ok: true, text: async () => 'April 1, 2025' });
  await expect(availableDates('x')).resolves.toEqual(['2025-04-01']);
  globalThis.fetch = old;
});

test('availableDates uses FAA home page by default', async () => {
  const old = globalThis.fetch;
  globalThis.fetch = async (url) => {
    expect(url).toBe(HOME_PAGE);
    return { ok: true, text: async () => 'April 1, 2025' };
  };
  await expect(availableDates()).resolves.toEqual(['2025-04-01']);
  globalThis.fetch = old;
});

test('availableDates rejects HTTP errors', async () => {
  const old = globalThis.fetch;
  globalThis.fetch = async () => ({ ok: false, status: 500 });
  await expect(availableDates('x')).rejects.toThrow('FAA HTTP 500');
  globalThis.fetch = old;
});
