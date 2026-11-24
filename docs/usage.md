# Usage

## Install and configure

FC2S requires Node.js 26 or newer and npm 12 or newer. Run commands from the repository root.

Install dependencies and create a local environment file:

```sh
npm ci
cp .env.example .env
```

In PowerShell, replace the copy command with `Copy-Item .env.example .env`. Set `DB_DRIVER=sqlite` to use the local SQLite backend. Set `DB_DRIVER=mysql` to use MySQL.

FC2S reads `.env` from the working directory. This table lists each environment variable, its default, and its required status.

| Variable         | Default     | Required status                               | Purpose                                           |
| ---------------- | ----------- | --------------------------------------------- | ------------------------------------------------- |
| `DB_DRIVER`      | `mysql`     | Optional. Use `mysql` or `sqlite`.            | Selects the import backend.                       |
| `MYSQL_HOSTNAME` | None        | Required when `DB_DRIVER=mysql`.              | MySQL-compatible server host name.                |
| `MYSQL_USERNAME` | None        | Required when `DB_DRIVER=mysql`.              | MySQL account name.                               |
| `MYSQL_PASSWORD` | None        | Required when `DB_DRIVER=mysql`.              | MySQL account password.                           |
| `MYSQL_PORT`     | `3306`      | Optional when `DB_DRIVER=mysql`.              | MySQL TCP port, from 1 through 65535.             |
| `MYSQL_SSL_CA`   | Unset       | Optional. Required when the server needs TLS. | Path to a trusted PEM CA bundle.                  |
| `NASR_PREFIX`    | `NASR_`     | Optional.                                     | Prefix for MySQL database names and export names. |
| `EXPORT_DIR`     | `./exports` | Optional.                                     | Directory for archives and temporary staging.     |

Use `MYSQL_HOSTNAME`, `MYSQL_USERNAME`, and `MYSQL_PASSWORD` only for MySQL imports. SQLite uses Node.js built-in `node:sqlite` and does not require a MySQL server or credentials. Relative `EXPORT_DIR` paths start from the repository root when you run the commands there.

Set a prefix that begins with a letter or underscore and uses only letters, digits, or underscores. FC2S adds the release date to the prefix. Keep `.env` local because it can contain credentials.

For example, use this minimal file for SQLite:

```dotenv
DB_DRIVER=sqlite
NASR_PREFIX=NASR_
EXPORT_DIR=./exports
```

For MySQL, set the backend and connection values:

```dotenv
DB_DRIVER=mysql
MYSQL_HOSTNAME=your_mysql_host
MYSQL_USERNAME=your_mysql_user
MYSQL_PASSWORD=your_mysql_password
MYSQL_PORT=3306
NASR_PREFIX=NASR_
EXPORT_DIR=./exports
# MYSQL_SSL_CA=/path/to/ca-chain.pem
```

When `MYSQL_SSL_CA` has a path, FC2S enables TLS and verifies the CA chain and server host name for MySQL connections and `mysqldump`. Use a host name that appears in the server certificate. Keep the value unset when the server allows connections without TLS.

## Select a dataset

Run `get:dates` to list the dates on the FAA NASR subscription page. The command sorts dates newest first. It labels the newest date as preview and the second newest as current.

```sh
npm run get:dates
npm run current
npm run latest
node bin/get_date.mjs 2026-10-29
node bin/get_date.mjs 2026-10-29 --verbose
node bin/get_all.mjs
node bin/get_sqlite_current.mjs
```

| Command                            | Dataset selection                                               |
| ---------------------------------- | --------------------------------------------------------------- |
| `npm run get:dates`                | Lists FAA release dates without importing data.                 |
| `npm run current`                  | Imports the second newest date, or the only date available.     |
| `npm run latest`                   | Imports the newest listed date.                                 |
| `node bin/get_date.mjs 2026-10-29` | Imports the supplied ISO date.                                  |
| `node bin/get_all.mjs`             | Imports every listed date sequentially, oldest date first.      |
| `node bin/get_sqlite_current.mjs`  | Imports the current date with SQLite regardless of `DB_DRIVER`. |

The import commands use `DB_DRIVER` and the other values in `.env`, except `get_sqlite_current.mjs`, which always selects SQLite. The date-specific command accepts `--verbose` to print progress and error details. All completed import commands print the output archive path.

FC2S reads FAA release labels and ignores page-modified timestamps. The date command checks the `YYYY-MM-DD` format and calendar date before it builds the FAA ZIP URL. It does not check if the date appears in the release list. The command fails if the FAA archive is unavailable. If no dates appear, check the network connection and the FAA subscription page.

## Read the output

FC2S replaces hyphens in a date with underscores when it builds a database name. With the default prefix, date `2026-10-29` uses database name `NASR_2026_10_29`.

| Backend | Archive path                            | Contents                                                           |
| ------- | --------------------------------------- | ------------------------------------------------------------------ |
| MySQL   | `EXPORT_DIR/NASR_2026_10_29.sql.tar.gz` | A gzip tar archive with one SQL dump file for each imported table. |
| SQLite  | `EXPORT_DIR/NASR_2026_10_29.sqlite.gz`  | A gzip-compressed SQLite database file.                            |

SQLite stores imported columns as text. This preserves source values such as leading zeros and decimal strings. Decompress the `.sqlite.gz` file before opening it with a SQLite tool.

FC2S keeps the MySQL database and completed archive. It removes the download, extracted files, and staging directory after a completed import. It does not remove archives for older dates. It replaces the same-date SQLite staging directory before each import.

If you must preserve a date's MySQL database, save a copy before import. FC2S drops and recreates that database, which deletes its current contents. Set `NASR_PREFIX` to prevent name collisions with other applications. Check that `EXPORT_DIR` and temporary storage provide sufficient capacity for the ZIP, extracted CSV files, database, and compressed archive.

If an import fails, inspect the error and same-date database or staging directory before retrying. A failed MySQL import can stop with an incomplete database. Retrying drops and recreates that database. FC2S writes archives through a temporary file. It replaces the prior archive after it creates a nonempty archive.

## Export an existing MySQL database

Run the dump command with a MySQL database name that uses letters, digits, underscores, or dollar signs:

```sh
node bin/dump_db.mjs DATABASE_NAME
```

The command reads MySQL connection values from `.env`. It writes `EXPORT_DIR/DATABASE_NAME.sql.tar.gz` with one SQL file for each table. If you keep files in `EXPORT_DIR/DATABASE_NAME`, move them first. The command deletes that staging directory before it starts and removes it again after it finishes. It does not drop or create the source database.

## Verify MySQL TLS

Set `MYSQL_SSL_CA` to the server's trusted CA bundle before you run this check. Use a MySQL account that can create and drop databases.

Run the TLS integration check only when the server certificate matches `MYSQL_HOSTNAME`:

```sh
node bin/check_mysql_tls.mjs
```

The check rejects an invalid CA and a host name that does not match the certificate. It then creates a temporary database, imports a CSV row, dumps a table, and drops the temporary database. It removes its temporary files if a check fails.

## MySQL requirements

MySQL imports require a reachable MySQL-compatible server, `mysqldump`, and `tar` on `PATH`. The database account must have permission to create and drop databases, create tables, load data, list tables, and dump table contents.

The server must allow `LOAD DATA LOCAL INFILE`. MariaDB commonly requires `local_infile=ON`. FC2S streams CSV data from the client host, so the CSV files do not require storage on the database server.

FC2S uses TLS only when `MYSQL_SSL_CA` is set. It verifies the CA chain and server host name for database connections and `mysqldump`. Keep the variable unset when the server permits connections without TLS.

## Diagnostics

Set `FC2S_VERBOSE=1` or set `DEBUG` to `fc2s` or `*` for detailed logs. The date-specific command also accepts `--verbose`. Logs can include local paths, host names, and error stacks. Inspect them before sharing.

See [Troubleshooting](troubleshooting.md) for help with setup, download, import, and export failures. See the [command index](../bin/README.md) for every launcher.
