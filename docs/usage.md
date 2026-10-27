# Usage

Install dependencies with `npm ci`, then copy `.env.example` to `.env`.
Select the storage backend with `DB_DRIVER`:

- `DB_DRIVER=mysql` (default) imports into MySQL and creates
  `exports/<db_name>.sql.tar.gz`, containing one standalone SQL file for each table.
  Set `MYSQL_HOSTNAME`, `MYSQL_USERNAME`, and `MYSQL_PASSWORD`. `MYSQL_PORT` is optional.

  To enable verified TLS, set `MYSQL_SSL_CA` to the PEM CA bundle that issued the database
  server certificate. FC2S verifies the certificate chain and server host name for both imports
  and dumps. TLS remains optional when `MYSQL_SSL_CA` is unset.
  MariaDB requires `local_infile=ON` for CSV imports. CSV data streams from the FC2S host through
  MySQL, so files stay on the host and outside the MariaDB container.

- `DB_DRIVER=sqlite` imports locally and creates
  `exports/<db_name>.sqlite.gz`, a gzip-compressed SQLite database file. No
  MySQL server or credentials are required.

Both backends use `NASR_PREFIX` (default `NASR_`) and `EXPORT_DIR` (default
`./exports`).

Set `DB_DRIVER` in `.env` to `mysql` or `sqlite`. Run `npm run get:dates` to list available FAA
release dates. Run `npm run current` or `npm run latest` to import with the selected driver.
Run `node bin/get_all.mjs` for every available dataset, or
`node bin/get_date.mjs YYYY-MM-DD` for one date. Run `node bin/dump_db.mjs <db_name>` to dump
an existing MySQL database.

The SQLite backend uses Node's built-in `node:sqlite` module and requires Node
26 or newer. Its schema declares FAA fields as `TEXT` so values such as
zero-padded identifiers and decimal strings keep their source representation.

Run `node bin/check_mysql_tls.mjs` to verify TLS, reject an invalid CA and host name, import a
local CSV with `LOAD DATA LOCAL INFILE`, and dump the table. This check creates and removes a
temporary `NASR_` database.
