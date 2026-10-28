import { dumpEnvironment } from "./environment.mjs";

export function dumpCommand(config, database, table) {
  return {
    command: "mysqldump",
    args: [
      "--no-defaults",
      "--password",
      "--single-transaction",
      "--skip-comments",
      "--host",
      config.host,
      "--port",
      String(config.port),
      "--user",
      config.user,
      ...(config.sslCa ? ["--ssl", "--ssl-ca", config.sslCa, "--ssl-verify-server-cert"] : []),
      database,
      table,
    ],
    options: {
      stdio: ["pipe", "pipe", "pipe"],
      env: dumpEnvironment(),
    },
  };
}
