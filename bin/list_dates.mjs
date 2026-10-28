import { availableDates, formatDates } from "../src/fetch-faa.mjs";

try {
  console.log(formatDates(await availableDates()));
} catch (e) {
  console.error(e.message);
  globalThis.process.exitCode = 1;
}
