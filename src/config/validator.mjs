export function validateConfig(values) {
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
