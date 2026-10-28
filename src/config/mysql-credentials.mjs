export function validateMysqlCredentials(values) {
  for (const key of ["host", "user", "password"]) {
    if (values[key] === undefined) {
      const envKey = key === "host" ? "HOSTNAME" : key === "user" ? "USERNAME" : "PASSWORD";
      throw new Error(`Missing MYSQL_${envKey}`);
    }
  }
}
