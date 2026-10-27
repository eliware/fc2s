# Usage

## Install and configure

Use Node.js 26 or newer. From the repository root, install dependencies and copy the sample environment file.

```sh
npm ci
cp .env.example .env
```

Set `DB_DRIVER` in `.env` to `mysql` or `sqlite`. It defaults to `mysql`.

| Variable         | Default     | Purpose                                           |
| ---------------- | ----------- | ------------------------------------------------- |
| `DB_DRIVER`      | `mysql`     | Selects the import backend.                       |
| `MYSQL_HOSTNAME` | —           | MySQL-compatible server host. Required for MySQL. |
| `MYSQL_USERNAME` | —           | MySQL account name. Required for MySQL.           |
| `MYSQL_PASSWORD` | —           | MySQL account password. Required for MySQL.       |
| `MYSQL_PORT`     | `3306`      | MySQL server port.                                |
| `MYSQL_SSL_CA`   | unset       | PEM CA bundle. This enables verified TLS.         |
| `NASR_PREFIX`    | `NASR_`     | Prefix for database and export names.             |
| `EXPORT_DIR`     | `./exports` | Output directory for archives and staging files.  |

SQLite uses Node's built-in `node:sqlite` module. It does not use MySQL credentials.

## Select a dataset

FC2S reads release dates from the FAA NASR subscription page. It accepts dates only from FAA release labels. Page-modified dates are ignored. Dates print newest first.

```sh
npm run get:dates
npm run current
npm run latest
```

The date commands run from the project root. The import commands use the backend in `.env`.

`latest` selects the newest listed date. `current` selects the second newest date. If only one date exists, `current` uses that date.

Other commands:

```sh
node bin/get_all.mjs
node bin/get_date.mjs 2026-10-13
node bin/get_date.mjs 2026-10-13 --verbose
node bin/list_dates.mjs
node bin/get_sqlite_current.mjs
node bin/dump_db.mjs DATABASE_NAME
node bin/check_mysql_tls.mjs
```

`get_all.mjs` starts imports for every listed date together. Use it when the host and database can run imports together. Reserve disk capacity for each run.

`get_date.mjs` imports the given ISO date. Its optional `--verbose` flag prints progress and errors.

`get_sqlite_current.mjs` selects SQLite for the current date regardless of the `DB_DRIVER` value in `.env`.

`dump_db.mjs` exports an existing MySQL database. It reads connection settings from `.env` and writes one SQL file for each table in a gzip tar archive.

`check_mysql_tls.mjs` requires `MYSQL_SSL_CA` and a reachable MySQL server. It checks that invalid CAs and hostnames fail. It then creates a temporary database, tests CSV import and table dumping, and removes its database and files.

## Output and database names

FC2S changes date hyphens to underscores in database names. With the default prefix, date `2026-10-13` produces `NASR_2026_10_13`.

MySQL output is `EXPORT_DIR/NASR_2026_10_13.sql.tar.gz`. It contains an SQL dump for each imported table. FC2S also creates the MySQL database and keeps it after export.

SQLite output is `EXPORT_DIR/NASR_2026_10_13.sqlite.gz`. Decompress it to get the SQLite database file. Its columns use text values to preserve source formatting, such as leading zeros and decimal strings.

**MySQL replaces the date-named database on each run.** FC2S drops and recreates that database. Set `NASR_PREFIX` to prevent collisions with other database names. SQLite replaces the same-date staging directory before import. The completed gzip archive remains after staging cleanup.

FC2S removes temporary download, extraction, and staging files after a completed run. It does not prune prior archives. Reserve sufficient disk capacity for each archive and the temporary ZIP and extracted CSV data.

## MySQL and TLS

MySQL use requires a reachable MySQL-compatible server and `mysqldump` on `PATH`. The account must create and drop the date-named database, create tables, load data, inspect tables, and dump table contents.

The server must allow `LOAD DATA LOCAL INFILE`. MariaDB commonly requires `local_infile=ON`. FC2S streams CSV data from its host to the server. CSV files can stay on the client host.

TLS is optional. Set `MYSQL_SSL_CA` to enable TLS with CA chain and host-name verification for the MySQL connection and `mysqldump`. Keep it unset when the server permits a connection without TLS. A server requiring TLS must have its trusted CA bundle configured here.

## Diagnostics

Set `FC2S_VERBOSE=1` or `DEBUG=fc2s` for detailed logs. The date-specific command also accepts `--verbose`. See [Troubleshooting](troubleshooting.md) for help with common errors.
