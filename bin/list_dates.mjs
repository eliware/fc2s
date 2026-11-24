import availableDates from "../src/fetch-faa.mjs";
import formatDates from "../src/format-dates.mjs";

try {
  console.log(formatDates(await availableDates()));
} catch (e) {
  console.error(e.message);
  globalThis.process.exitCode = 1;
}
