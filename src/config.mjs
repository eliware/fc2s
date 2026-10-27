import { loadEnvironment } from "./config/environment.mjs";

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

  if (!["mysql", "sqlite"].includes(values.driver)) {
    throw new Error(`Unsupported database driver: ${values.driver}`);
  }

  if (values.driver === "mysql") {
    for (const key of ["host", "user", "password"]) {
      if (values[key] === undefined) {
        const envKey = key === "host" ? "HOSTNAME" : key === "user" ? "USERNAME" : "PASSWORD";
        throw new Error(`Missing MYSQL_${envKey}`);
      }
    }
  }
  return values;
}
