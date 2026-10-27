export async function cleanupProcess(work, dumpDir, archived, rm, operationError) {
  let cleanupError;
  try {
    await rm(work, { recursive: true, force: true });
  } catch (error) {
    cleanupError = error;
  }
  if (archived) {
    try {
      await rm(dumpDir, { recursive: true, force: true });
    } catch (error) {
      cleanupError ??= error;
    }
  }
  if (operationError) throw operationError;
  if (cleanupError) throw cleanupError;
}
