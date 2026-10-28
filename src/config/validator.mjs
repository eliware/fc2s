import { validateMysqlCredentials } from "./mysql-credentials.mjs";

export function validateConfig(values) {
  if (!["mysql", "sqlite"].includes(values.driver)) {
    throw new Error(`Unsupported database driver: ${values.driver}`);
  }

  if (values.driver === "mysql") validateMysqlCredentials(values);
  return values;
}
