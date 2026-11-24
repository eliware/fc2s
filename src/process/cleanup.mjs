export default async function cleanupProcess(work, dumpDir, archived, rm, operationError) {
  const cleanupErrors = [];
  try {
    await rm(work, { recursive: true, force: true });
  } catch (error) {
    cleanupErrors.push(error);
  }
  if (archived) {
    try {
      await rm(dumpDir, { recursive: true, force: true });
    } catch (error) {
      cleanupErrors.push(error);
    }
  }
  if (operationError && cleanupErrors.length) {
    throw new AggregateError([operationError, ...cleanupErrors], "Operation and cleanup failed", {
      cause: operationError,
    });
  }
  if (operationError) throw operationError;
  if (cleanupErrors.length === 1) throw cleanupErrors[0];
  if (cleanupErrors.length > 1) {
    throw new AggregateError(cleanupErrors, "Multiple cleanup steps failed", {
      cause: cleanupErrors[0],
    });
  }
}
