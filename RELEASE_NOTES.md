# Release Notes

## 15.2.1 — 2026-11-27

### Changed

- Use `mariadb-dump` with verified TLS and a temporary credentials file for MySQL exports.
- Refresh compatible dependencies for package version 15.2.1.
- Keep database host names and usernames out of verbose configuration logs.
- Load `.env` settings from the current working directory without changing `process.env`.
- Split configuration loading, schema building, column normalization, and download cleanup into focused modules.
- Require `mariadb-dump` and update MySQL setup guidance.

### Fixed

- Preserve download and dump errors when cleanup or output writing also fails.
- Validate database names before passing them to `mariadb-dump`.

## 15.2.0 — 2026-11-24

### Added

- Add a NAS deployment target to the Eliware Knit configuration.
- Add package subpath exports for the archive, file, and MySQL modules.

### Changed

- Set the FC2S package version to 15.2.0 and update Eliware Test to 15.2.0.
- Refresh the package lockfile with current compatible dependency versions.
- Refactor implementation modules to use one default export and private helpers.
- Separate download progress, schema column mapping, and SQLite table definition modules.
- Expand setup, configuration, command, output, and troubleshooting guidance.
- Describe SQLite and MySQL outputs as compressed archives in `.env.example`.
- Ignore environment files while allowing `.env.example` files.

### Fixed

- Report cleanup failures together with the import failure.

## 15.0.1 — 2026-10-28

### Added

- Add FAA NASR date discovery and imports for MySQL and SQLite.
- Add npm commands for listing dates and importing current or latest datasets through `DB_DRIVER`.
- Add optional verified TLS for MySQL connections, CSV imports, and SQL dumps.
- Add a MySQL TLS integration check for CA and host-name verification and local CSV streaming.
- Add user guides, requirements, troubleshooting, CLI indexes, and repository specifications.
- Add GitHub Actions validation and the Eliware Knit deployment workflow.

### Changed

- Use Node.js 26 and native ESM. Follow Eliware Test v15.0.1 conventions.
- Update dependencies, repository metadata, and validation scripts.
- Stream FAA ZIP downloads to disk and delete incomplete files after failures.
- Run `all` imports sequentially from oldest date to newest.
- Mark the newest FAA date as preview and the second-newest as current.
- Validate FAA dates, MySQL ports, database identifiers, ZIP paths, and symbolic-link components.
- Use MySQL `VERIFY_IDENTITY` mode for `mysqldump` when `MYSQL_SSL_CA` is set.
- Stop failed dump processes, delete incomplete table dumps, and remove standalone dump staging after failures.
- Stage MySQL and SQLite archives beside their final paths, preserving any prior valid archive when creation fails.
- Omit request URLs from verbose HTTP logs.
- Refactor archive, configuration, file, MySQL, process, schema, and SQLite code into focused modules.

- Move the CLI commands to `bin/`. Remove launchers from `examples/`.
- Replace the prior tag-publishing workflow with the current validation workflow.
- Replace the root specification with `docs/requirements.md` and `specs/` indexes.
