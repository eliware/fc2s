import {process as runProcess} from '../src/process.mjs';
try { console.log((await runProcess('latest')).join('\n')); } catch (e) { console.error(e.message); globalThis.process.exitCode=1; }
