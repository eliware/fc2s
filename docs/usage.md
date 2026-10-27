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
`./exports`). Run `node examples/get_current.mjs`, `node
examples/get_latest.mjs`, or `node examples/get_all.mjs`. The dedicated SQLite
current-dataset example is `node examples/get_sqlite_current.mjs`.

The SQLite backend uses Node's built-in `node:sqlite` module and requires Node
26 or newer. Its schema declares FAA fields as `TEXT` so values such as
zero-padded identifiers and decimal strings keep their source representation.

Run `node examples/get_date.mjs YYYY-MM-DD` to import one date. Run
`node examples/list_dates.mjs` to list dates published by FAA. Run
`node examples/dump_db.mjs <db_name>` to export an existing MySQL database.

Run `node examples/check_mysql_tls.mjs` to verify TLS connection and dump behavior, reject
an invalid CA and server host name, and import a local CSV using `LOAD DATA LOCAL INFILE`. The
check creates and removes a temporary `NASR_` database.
