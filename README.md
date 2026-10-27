# [![eliware.org](https://eliware.org/logos/brand.png)](https://discord.gg/M6aTR9eTwN)

## @eliware/fc2s [![License](https://img.shields.io/github/license/eliware/fc2s)](https://github.com/eliware/fc2s/blob/main/LICENSE) [![CI](https://github.com/eliware/fc2s/actions/workflows/ci.yaml/badge.svg)](https://github.com/eliware/fc2s/actions/workflows/ci.yaml)

Node.js ESM importer for FAA NASR CSV datasets with MySQL and SQLite exports.

## Table of Contents

- [Features](#features)
- [Requirements](#requirements)
- [Setup](#setup)
- [Usage](#usage)
- [Development](#development)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)
- [Security](#security)
- [Configuration](#configuration)
- [Operations](#operations)
- [Support](#support)
- [Links](#links)
- [License](#license)

## Features

FC2S downloads FAA NASR datasets, imports their CSV tables, and exports them for local use.
The MySQL backend creates one SQL dump for each table in a gzip-compressed tar archive.
The SQLite backend creates a gzip-compressed SQLite database file.

## Requirements

Use Node.js 26 or later and npm 12 or later.
MySQL imports require a reachable MySQL-compatible server and the `mysql` command-line client.
SQLite imports use Node.js built-in `node:sqlite` and require no server.

## Setup

Run `npm ci` from the repository root. Copy `.env.example` to `.env` and configure the selected backend.
Set `DB_DRIVER=mysql` for MySQL or `DB_DRIVER=sqlite` for SQLite.

## Usage

Run `node examples/get_current.mjs` to import the current dataset.
Run `node examples/get_latest.mjs` for the latest dataset, or `node examples/get_all.mjs` for all available datasets.
Read [usage documentation](docs/usage.md), [examples](examples/README.md), and [release notes](RELEASE_NOTES.md).

## Development

Read [AGENTS.md](AGENTS.md), the [documentation index](docs/README.md), the [requirements](docs/requirements.md), and the [specifications index](specs/README.md) before changing behavior.
Use `npm run lint` and `npm run format:check` for focused checks.

## Testing

Run focused tests first. Use `npm test -- tests/sqlite.test.mjs` for one test file.
Use `npm test -- tests/config.test.mjs tests/process.test.mjs` for multiple test files.
Run the full `npm test` suite before a commit or release.

## Troubleshooting

Run `npm ci` and `npm test` when dependencies or behavior are unclear.
Read [troubleshooting documentation](docs/troubleshooting.md) for configuration and runtime errors.

## Security

Keep credentials, downloaded datasets, and generated exports outside Git.
Store MySQL credentials in the local `.env` file. SQLite runs without database credentials.

## Configuration

`DB_DRIVER` selects `mysql` or `sqlite` and defaults to `mysql`.
`MYSQL_HOSTNAME`, `MYSQL_USERNAME`, and `MYSQL_PASSWORD` are required for MySQL. `MYSQL_PORT` is optional.
`NASR_PREFIX` sets the imported database name prefix and defaults to `NASR_`.
`EXPORT_DIR` sets the output directory and defaults to `./exports`.

## Operations

The examples import current, latest, date-specific, or all datasets.
MySQL output is `exports/<db_name>.sql.tar.gz` with one SQL file for each table.
SQLite output is `exports/<db_name>.sqlite.gz` with one compressed database file.
See [usage documentation](docs/usage.md) for commands and output details.

## Support

For help, questions, or to chat with the author and community, visit:

[![Discord](https://eliware.org/logos/discord_96.png)](https://discord.gg/M6aTR9eTwN)[![eliware.org](https://eliware.org/logos/eliware_96.png)](https://discord.gg/M6aTR9eTwN)

**[eliware.org on Discord](https://discord.gg/M6aTR9eTwN)**

## Links

- [Home Page](https://eliware.org)
- [GitHub Org](https://github.com/eliware)
- [GitHub Repo](https://github.com/eliware/fc2s)
- [Bug Reports](https://github.com/eliware/fc2s/issues)
- [Discord](https://discord.gg/M6aTR9eTwN)

## License

[MIT © Eliware](LICENSE)
