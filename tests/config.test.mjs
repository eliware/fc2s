import { config } from "../src/config.mjs";

test("config accepts overrides", () => {
  expect(config({ driver: "mysql", host: "h", user: "u", password: "p", port: 3307 }).port).toBe(
    3307,
  );
});
test("config uses environment values and fallback defaults", () => {
  const saved = { ...process.env };
  process.env.MYSQL_HOSTNAME = "env-host";
  process.env.MYSQL_USERNAME = "env-user";
  process.env.MYSQL_PASSWORD = "env-pass";
  process.env.MYSQL_PORT = "3308";
  process.env.DB_DRIVER = "mysql";
  process.env.MYSQL_SSL_CA = "/ca.pem";
  process.env.NASR_PREFIX = "X_";
  process.env.EXPORT_DIR = "/tmp/x";
  expect(config()).toMatchObject({
    driver: "mysql",
    host: "env-host",
    user: "env-user",
    password: "env-pass",
    port: 3308,
    sslCa: "/ca.pem",
    prefix: "X_",
    exportDir: "/tmp/x",
  });
  for (const key of [
    "DB_DRIVER",
    "MYSQL_HOSTNAME",
    "MYSQL_USERNAME",
    "MYSQL_PASSWORD",
    "MYSQL_PORT",
    "MYSQL_SSL_CA",
    "NASR_PREFIX",
    "EXPORT_DIR",
  ])
    delete process.env[key];
  expect(config({ host: "h", user: "u", password: "p" })).toMatchObject({
    driver: "mysql",
    port: 3306,
    prefix: "NASR_",
    exportDir: "./exports",
  });
  process.env = saved;
});

test("MySQL config allows TLS to remain unconfigured", () => {
  const saved = { ...process.env };
  delete process.env.MYSQL_SSL_CA;
  expect(config({ driver: "mysql", host: "h", user: "u", password: "p" }).sslCa).toBeUndefined();
  process.env = saved;
});

test("SQLite config does not require MySQL credentials", () => {
  const saved = { ...process.env };
  for (const key of ["MYSQL_HOSTNAME", "MYSQL_USERNAME", "MYSQL_PASSWORD"]) delete process.env[key];
  process.env.DB_DRIVER = "sqlite";
  expect(config()).toMatchObject({ driver: "sqlite", prefix: "NASR_" });
  process.env = saved;
});
