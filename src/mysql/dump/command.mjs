import validateIdentifier from "../../schema/validate-identifier.mjs";

export default function dumpCommand(config, database, table, credentialsFile) {
  validateIdentifier(database);
  validateIdentifier(table);
  return {
    command: "mariadb-dump",
    args: [
      `--defaults-file=${credentialsFile}`,
      "--single-transaction",
      "--skip-comments",
      "--host",
      config.host,
      "--port",
      String(config.port),
      "--user",
      config.user,
      ...(config.sslCa ? ["--ssl-ca", config.sslCa, "--ssl-verify-server-cert"] : []),
      database,
      table,
    ],
    options: {
      stdio: ["pipe", "pipe", "pipe"],
    },
  };
}
