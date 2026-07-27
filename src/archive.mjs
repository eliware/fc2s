import path from 'node:path';
import { spawn as defaultSpawn } from 'node:child_process';

export function tarGz(output, dir, root = path.basename(path.resolve(dir)), deps = {}) {
  const spawn = deps.spawn ?? defaultSpawn;
  return new Promise((resolve, reject) => {
    const parent = path.dirname(path.resolve(dir));
    const child = spawn('tar', ['-czf', output, '-C', parent, root], {
      stdio: ['ignore', 'ignore', 'pipe'],
    });
    let errorOutput = '';
    child.stderr?.on('data', (chunk) => { errorOutput += chunk; });
    child.on('error', reject);
    child.on('close', (code) => {
      if (code) {
        const detail = errorOutput.trim();
        reject(new Error(detail ? `tar failed: ${detail}` : `tar failed: ${code}`));
      } else resolve();
    });
  });
}
