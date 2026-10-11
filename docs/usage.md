# Usage

Install dependencies with `npm install`, then copy `.env.example` to `.env`.
Choose the storage backend with `DB_DRIVER`:

- `DB_DRIVER=mysql` (default) imports into MySQL and creates
  `exports/<db_name>.sql.tar.gz`, containing one standalone SQL file per table.
  Set `MYSQL_HOSTNAME`, `MYSQL_USERNAME`, and `MYSQL_PASSWORD`; `MYSQL_PORT`
  is optional.
- `DB_DRIVER=sqlite` imports locally and creates
  `exports/<db_name>.sqlite.gz`, a gzip-compressed SQLite database file. No
  MySQL server or credentials are needed.

Both backends use `NASR_PREFIX` (default `NASR_`) and `EXPORT_DIR` (default
`./exports`). Run `node examples/get_current.mjs`, `node
examples/get_latest.mjs`, or `node examples/get_all.mjs`. The dedicated SQLite
current-dataset example is `node examples/get_sqlite_current.mjs`.

The SQLite backend uses Node's built-in `node:sqlite` module and requires Node
24.15 or newer. Its schema declares FAA fields as `TEXT` so values such as
zero-padded identifiers and decimal strings retain their source representation.
