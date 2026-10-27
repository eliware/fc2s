# Usage

Install dependencies with `npm ci`, then copy `.env.example` to `.env`.
Select the storage backend with `DB_DRIVER`:

- `DB_DRIVER=mysql` (default) imports into MySQL and creates
  `exports/<db_name>.sql.tar.gz`, containing one standalone SQL file for each table.
  Set `MYSQL_HOSTNAME`, `MYSQL_USERNAME`, and `MYSQL_PASSWORD`.
  `MYSQL_PORT` is optional.
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
