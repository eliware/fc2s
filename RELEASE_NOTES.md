# Release Notes

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
- Omit request URLs from verbose HTTP logs.
- Refactor archive, configuration, file, MySQL, process, schema, and SQLite code into focused modules.

- Move the CLI commands to `bin/`. Remove launchers from `examples/`.
- Replace the prior tag-publishing workflow with the current validation workflow.
- Replace the root specification with `docs/requirements.md` and `specs/` indexes.
