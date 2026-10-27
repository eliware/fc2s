import { loadEnvironment } from "./config/environment.mjs";
import { validateConfig } from "./config/validator.mjs";

export function config(overrides = {}) {
  const env = loadEnvironment();
  const values = {
    driver: env.DB_DRIVER || "mysql",
    host: env.MYSQL_HOSTNAME,
    user: env.MYSQL_USERNAME,
    password: env.MYSQL_PASSWORD,
    port: Number(env.MYSQL_PORT || 3306),
    sslCa: env.MYSQL_SSL_CA,
    prefix: env.NASR_PREFIX || "NASR_",
    exportDir: env.EXPORT_DIR || "./exports",
    ...overrides,
  };

  return validateConfig(values);
}
