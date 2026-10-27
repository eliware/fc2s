import "dotenv/config";

export function config(overrides = {}) {
  const values = {
    driver: process.env.DB_DRIVER || "mysql",
    host: process.env.MYSQL_HOSTNAME,
    user: process.env.MYSQL_USERNAME,
    password: process.env.MYSQL_PASSWORD,
    port: Number(process.env.MYSQL_PORT || 3306),
    sslCa: process.env.MYSQL_SSL_CA,
    prefix: process.env.NASR_PREFIX || "NASR_",
    exportDir: process.env.EXPORT_DIR || "./exports",
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
