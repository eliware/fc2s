import {availableDates} from '../src/fetch-faa.mjs';

try {
  console.log((await availableDates()).join('\n'));
} catch (e) {
  console.error(e.message);
  globalThis.process.exitCode = 1;
}
