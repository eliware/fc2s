import { validateMysqlCredentials } from "./mysql-credentials.mjs";

export function validateConfig(values) {
  if (!["mysql", "sqlite"].includes(values.driver)) {
    throw new Error(`Unsupported database driver: ${values.driver}`);
  }

  if (values.driver === "mysql") {
    validateMysqlCredentials(values);
    if (!Number.isInteger(values.port) || values.port < 1 || values.port > 65535) {
      throw new Error(`Invalid MYSQL_PORT: ${values.port}`);
    }
  }
  return values;
}
