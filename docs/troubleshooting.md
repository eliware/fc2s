# Troubleshooting

Read the command output first. To see more, run the date-specific command with `--verbose`. You can also set `FC2S_VERBOSE=1` or `DEBUG=fc2s`. Logs can contain local paths, host names, and error stacks. Inspect them before sharing.

## Setup and configuration

**`Unsupported database driver`** — Set `DB_DRIVER` in `.env` to `mysql` or `sqlite`.

**`Missing MYSQL_HOSTNAME`, `Missing MYSQL_USERNAME`, or `Missing MYSQL_PASSWORD`** — These settings are required only for MySQL. Add them to `.env`. SQLite does not use them.

**`node:sqlite` is unavailable** — Install Node.js 26 or newer. Check the active version with `node --version`.

**Packages are missing or inconsistent** — Run `npm ci` from the repository root.

## FAA dates and downloads

**`No FAA dates` or no output from `npm run get:dates`** — Check network access and the FAA subscription page. FC2S reads dates from FAA release labels. It ignores page-modified timestamps. The FAA page format may have changed if no dates appear.

**`FAA HTTP ...` or `Download HTTP ...`** — The FAA returned an unsuccessful response. Check proxy and firewall rules, network access, and the FAA site. The date page and ZIP host can have separate outages.

**ZIP extraction or schema errors** — Check temporary disk capacity and retry the date. If the same ZIP fails again, save the error output and date for diagnosis.

## MySQL

**Connection refused, timeout, or authentication error** — Check `MYSQL_HOSTNAME`, `MYSQL_PORT`, credentials, network access, and account permissions. The default port is `3306`.

**TLS certificate or host-name error** — Set `MYSQL_SSL_CA` to a readable PEM bundle that trusts the server certificate. Connect with a host name listed in that certificate. FC2S rejects invalid CA chains and host-name mismatches. Remove `MYSQL_SSL_CA` only if the server permits connections without TLS.

**`mysqldump` cannot start** — Install MySQL command-line tools and make sure `mysqldump` is on `PATH`. `npm ci` does not install this system command.

**`LOAD DATA LOCAL INFILE` fails** — Allow local infile on the server. MariaDB commonly uses `local_infile=ON`. Check account rights. FC2S sends CSV data from its own host, so the files can stay on the client host.

**Database create, drop, or dump permission error** — Grant the account rights to create and drop the date-named database. It also needs rights to create tables, load data, list tables, and dump rows. Check `NASR_PREFIX` before retrying. A MySQL import replaces the matching database.

## SQLite and files

**Cannot create a database or archive** — Check write access and disk capacity for `EXPORT_DIR` and the system temporary directory. ZIP downloads, extracted CSV files, SQLite databases, and archives all use storage.

**Archive missing after a failed run** — FC2S marks an archive complete only after writing a nonempty file. Check the error and any same-date staging directory in `EXPORT_DIR`. A retry clears that directory. A failed MySQL import can produce an incomplete database. A retry for that date drops and recreates it.

## Tests

Run `npm test` from the repository root. If it fails, start with the first failing test. Confirm that the installed Node.js and npm versions match the project requirements.
