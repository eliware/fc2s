import assert from "node:assert/strict";
import { lookup } from "node:dns/promises";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { config } from "../src/config.mjs";
import { db, dumpTable } from "../src/mysql.mjs";

const settings = config();
if (!settings.sslCa) throw new Error("Set MYSQL_SSL_CA to run the TLS integration check");

const temp = await mkdtemp(path.join(os.tmpdir(), "fc2s-mysql-tls-"));
const database = `NASR_TLS_CHECK_${randomBytes(6).toString("hex")}`;
const csv = path.join(temp, "row.csv");
const dump = path.join(temp, "table.sql");
let connection;

async function expectConnectionFailure(settingsToTest, label) {
  await assert.rejects(db(settingsToTest), undefined, label);
}

try {
  const badCa = path.join(temp, "invalid-ca.pem");
  await writeFile(badCa, "not a certificate");
  await expectConnectionFailure({ ...settings, sslCa: badCa }, "an invalid CA must be rejected");

  const address = (await lookup(settings.host, { all: true })).find(({ family }) => family === 4);
  if (!address) throw new Error("Could not resolve the MySQL host to an IPv4 address");
  await expectConnectionFailure(
    { ...settings, host: address.address },
    "a host name that does not match the certificate must be rejected",
  );

  connection = await db(settings);
  await connection.query(`CREATE DATABASE \`${database}\``);
  await connection.query(`CREATE TABLE \`${database}\`.tls_check (value VARCHAR(40) NOT NULL)`);
  await writeFile(csv, "verified-tls-import\n");
  await connection.query(
    `LOAD DATA LOCAL INFILE '${csv}' INTO TABLE \`${database}\`.tls_check FIELDS TERMINATED BY ',' LINES TERMINATED BY '\\n' (value)`,
  );
  const [rows] = await connection.query(`SELECT value FROM \`${database}\`.tls_check`);
  assert.deepEqual(rows, [{ value: "verified-tls-import" }]);

  await dumpTable(settings, database, "tls_check", dump);
  console.log(
    "Verified TLS connection, rejected invalid CA and host name, imported CSV, and dumped table.",
  );
} finally {
  try {
    if (connection) await connection.query(`DROP DATABASE IF EXISTS \`${database}\``);
  } finally {
    await connection?.end();
    await rm(temp, { recursive: true, force: true });
  }
}
