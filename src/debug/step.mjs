import log from "../debug.mjs";

export default async function step(name, fn) {
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
