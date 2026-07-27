import {processDate} from '../src/process.mjs';

const verbose = globalThis.process.argv.includes('--verbose');
if (verbose) process.env.FC2S_VERBOSE = '1';
const date = globalThis.process.argv.find(x => /^\d{4}-\d{2}-\d{2}$/.test(x));
if (!date) {
  console.error('Usage: node examples/get_date.mjs YYYY-MM-DD');
  globalThis.process.exitCode = 1;
} else {
  try {
    console.log(await processDate(date));
  } catch (e) {
    console.error(e.stack || e.message);
    globalThis.process.exitCode = 1;
  }
}
