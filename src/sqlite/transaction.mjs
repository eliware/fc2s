export async function transaction(database, operation) {
  let started = false;
  try {
    database.exec("PRAGMA journal_mode = DELETE; PRAGMA synchronous = FULL; BEGIN IMMEDIATE;");
    started = true;
    const result = await operation();
    database.exec("COMMIT;");
    started = false;
    return result;
  } catch (error) {
    if (started) {
      try {
        database.exec("ROLLBACK;");
      } catch {
        /* Preserve the operation error. */
      }
    }
    throw error;
  } finally {
    database.close();
  }
}
