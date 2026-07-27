const enabled = () =>
  process.env.FC2S_VERBOSE === '1' ||
  process.env.DEBUG === 'fc2s' ||
  process.env.DEBUG === '*';

export function log(message, data) {
  if (!enabled()) return;
  const suffix = data === undefined
    ? ''
    : ` ${typeof data === 'string' ? data : JSON.stringify(data)}`;
  console.error(`[fc2s ${new Date().toISOString()}] ${message}${suffix}`);
}

export function isVerbose() {
  return enabled();
}

export async function step(name, fn) {
  const start = Date.now();
  log(`START ${name}`);
  try {
    const result = await fn();
    log(`DONE ${name} (${Date.now() - start}ms)`);
    return result;
  } catch (error) {
    log(`FAIL ${name} (${Date.now() - start}ms)`, {
      name: error.name,
      message: error.message,
      stack: error.stack,
    });
    throw error;
  }
}
