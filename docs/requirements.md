# Requirements

## Purpose

FC2S downloads FAA NASR datasets, imports their CSV tables into MySQL or SQLite, and writes compressed exports.

## Runtime and setup

Use Node.js 26 or newer. The project uses native ECMAScript modules and Node's built-in SQLite support.

Install dependencies with `npm ci`. Copy `.env.example` to `.env` before a MySQL import.

Set `DB_DRIVER` to `mysql` or `sqlite`. Its default is `mysql`.

MySQL requires `MYSQL_HOSTNAME`, `MYSQL_USERNAME`, and `MYSQL_PASSWORD`. `MYSQL_PORT` defaults to `3306`.

`NASR_PREFIX` defaults to `NASR_`. `EXPORT_DIR` defaults to `./exports`.

SQLite requires no MySQL server or credentials.

## Dataset workflow

The application reads FAA dataset dates, selects the requested dataset, downloads its ZIP, and extracts CSV files into a temporary directory.

It reads the FAA schema and creates database tables. SQLite columns use text values to preserve source representations.

MySQL creates one SQL dump for each table and packages the dumps as `<db_name>.sql.tar.gz`.

SQLite writes `<db_name>.sqlite.gz`, which decompresses to one SQLite database file.

The application validates the completed output and removes temporary working files after success.

## Examples

Run `node examples/get_current.mjs` for the current FAA dataset.

Run `node examples/get_latest.mjs` for the latest published dataset.

Run `node examples/get_all.mjs` for all available datasets.

Run `node examples/get_date.mjs YYYY-MM-DD` for one specified dataset date.

Run `node examples/list_dates.mjs` to print FAA dataset dates.

Run `node examples/get_sqlite_current.mjs` to select SQLite for the current dataset.

The selected driver applies to examples unless an example selects SQLite directly.

## Safety

Keep `.env`, downloaded datasets, and exports outside Git. Validate database identifiers before using them in SQL or file paths.

Use safe process arguments for database tools. Do not expose passwords in command-line arguments or logs.

Remove only process-owned temporary paths. Preserve the initial error when cleanup or external operations fail.
