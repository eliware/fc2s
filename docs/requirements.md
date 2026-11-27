# Requirements and behavior

## Runtime

FC2S requires Node.js 26 or newer and npm 12 or newer. Run commands from the repository root. Install dependencies with `npm ci`.

FC2S requires network access to the FAA NASR subscription page and ZIP archive host. The host requires writable temporary storage for downloads and extracted CSV files. Keep sufficient storage capacity for database files and compressed archives.

MySQL imports require a reachable MySQL-compatible server, `mariadb-dump`, and `tar` on `PATH`. On Windows, add a compatible `tar.exe` to `PATH`. The MySQL server must allow `LOAD DATA LOCAL INFILE`. The account must have permission to create and drop databases, create tables, load rows, list tables, and dump table contents.

SQLite imports run locally through Node.js built-in `node:sqlite`. They do not require a MySQL server or MySQL credentials.

## Configuration

FC2S reads settings from the process environment and `.env` in the repository root. It accepts `DB_DRIVER=mysql` or `DB_DRIVER=sqlite`. MySQL credentials are required only when `DB_DRIVER=mysql`.

The [usage guide](usage.md#install-and-configure) lists every environment variable, its default, and its required status. When `MYSQL_SSL_CA` contains a path, FC2S verifies the trusted CA chain and server host name. Keep the variable unset when the server allows connections without TLS.

## Import workflow

FC2S reads FAA release labels, sorts their dates newest first, downloads the selected ZIP file, and extracts its CSV files. It uses the FAA data-structure CSV files to create database tables and load rows.

`latest` selects the newest listed date. `current` selects the second newest date, or the only available date. `all` imports each listed date in sequence from oldest to newest. The date command imports the ISO date that the user supplies.

MySQL imports drop and recreate the date-named database. They create tables, load CSV rows, dump each table with `mariadb-dump`, and write a `.sql.tar.gz` archive.

SQLite imports create text columns and load CSV rows in a transaction. They gzip the resulting database as a `.sqlite.gz` archive. Text columns preserve source values such as leading zeros and decimal strings.

## Data retention

Completed imports remove temporary downloads, extracted files, and staging directories. They keep completed archives. MySQL databases remain after export. FC2S does not prune archives for older dates.

A failed import can stop with an incomplete MySQL database or staging directory. Inspect these items before retrying. A retry drops and recreates the matching MySQL database and replaces the matching SQLite staging directory.

The [usage guide](usage.md) documents command results, archive names, and database safety. The [troubleshooting guide](troubleshooting.md) lists recovery steps for common failures.
