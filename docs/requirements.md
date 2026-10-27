# Requirements and behavior

## Runtime

FC2S requires Node.js 26 or newer. The SQLite backend uses the built-in `node:sqlite` module. Install package dependencies with `npm ci`.

The host requires network access to the FAA NASR subscription page and data archive host. It requires writable temporary storage for ZIP downloads and extraction. Reserve sufficient capacity in `EXPORT_DIR` for archives and working files.

MySQL imports require a reachable MySQL-compatible server and `mysqldump` on `PATH`. The database account must create and drop databases, create tables, load rows, list tables, and dump table contents. The server must allow `LOAD DATA LOCAL INFILE` so FC2S can send CSV rows from the client host.

SQLite imports run locally. They run without a MySQL server or MySQL credentials.

## Configuration

FC2S reads environment variables and values from `.env` in the project root. `DB_DRIVER` accepts `mysql` or `sqlite`. Its default is `mysql`.

MySQL uses `MYSQL_HOSTNAME`, `MYSQL_USERNAME`, and `MYSQL_PASSWORD`. All three are required. `MYSQL_PORT` defaults to `3306`. `MYSQL_SSL_CA` is optional. When set, FC2S enables TLS and verifies the trusted CA chain and server host name. Without this variable, TLS is not requested by FC2S.

`NASR_PREFIX` defaults to `NASR_`. `EXPORT_DIR` defaults to `./exports`. The [usage guide](usage.md#install-and-configure) lists each variable.

## Import workflow

FC2S reads FAA dates from release labels and sorts them newest first. It downloads the selected ZIP file and extracts its CSV files into a temporary directory. The FAA data-structure CSV supplies table and field definitions.

For MySQL, FC2S drops and recreates the date-named database. It creates the tables, loads CSV rows, dumps each table with `mysqldump`, and packages the dumps in a `.sql.tar.gz` archive.

For SQLite, FC2S creates a local database with text columns. It imports CSV data in a transaction and compresses the finished database to `.sqlite.gz`.

`latest` selects the newest listed date. `current` selects the second newest when available. It uses the only available date when the page lists one. `all` selects every listed date and starts those imports together. A date command selects one ISO date.

Completed runs remove download, extraction, and staging files. Database and archive outputs remain. A failed run can produce an incomplete database or staging directory. Inspect these before retrying.

## Commands

Run `npm run get:dates` to list FAA dates. Run `npm run current` or `npm run latest` to import with the backend from `.env`. Other scripts are listed in the [command guide](../bin/README.md). See [Usage](usage.md#select-a-dataset) for examples.

## Data and credentials

A repeated MySQL import drops and recreates its date-named database. Set `NASR_PREFIX` to prevent collisions with unrelated databases. Keep `.env` out of source control because it contains database credentials.

FAA datasets and generated exports can be large. Keep them out of source control and reserve disk capacity for output and temporary files. Verbose logs can contain paths, host details, and error stacks. Inspect logs before sharing them.
