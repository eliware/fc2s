# Release Notes

## 15.0.1 — 2026-10-27

### Added

- Add npm commands for listing dates and importing current or latest datasets using `DB_DRIVER`.
- Add optional verified TLS for MySQL connections, CSV imports, and SQL dumps.
- Add a live MySQL TLS integration check for certificate validation and local CSV streaming.
- Add SQLite dataset imports and gzip-compressed database exports.
- Add usage, requirements, troubleshooting, and configuration documentation for both backends.

### Changed

- Process FAA dates in sequence to lower resource use.
- Remove standalone database dump staging files after success or failure, reject unsafe table identifiers before spawning `mysqldump`, and omit request URLs from verbose HTTP logs.
- Label the newest FAA date as preview and the second-newest as current in `get:dates` output.
- Set the package and repository metadata to Eliware Test v15.0.1 conventions.
- Update runtime requirements to Node.js 26 and use shared Eliware Test validation.
- Update dependencies and CLI commands for the current MySQL and SQLite workflows.
- Add FAA date discovery, dataset selection, downloads, schema parsing, and MySQL imports.
- Add per-table SQL dumps, gzip archives, and process-owned temporary-file cleanup.
- Add tests, CLI commands, configuration guidance, and repository specifications.
