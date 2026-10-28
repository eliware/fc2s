import { validateIdentifier } from "../../schema/identifier.mjs";

export function dumpCommand(config, database, table) {
  validateIdentifier(table);
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
      ...(config.sslCa ? ["--ssl-ca", config.sslCa, "--ssl-mode=VERIFY_IDENTITY"] : []),
      database,
      table,
    ],
    options: {
      stdio: ["pipe", "pipe", "pipe"],
    },
  };
}
