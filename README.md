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

FC2S imports FAA NASR CSV datasets into MySQL or SQLite and writes compressed exports.

## Requirements

Use Node.js 26 or later and npm 12 or later. MySQL imports require a MySQL-compatible server, `mariadb-dump`, and `tar`. SQLite uses Node.js built-in `node:sqlite`.

## Setup

Run `npm ci` from the repository root. Copy `.env.example` to `.env`, then set the database driver and any required connection values.

## Usage

Run `npm run get:dates` to list FAA release dates. Run `npm run current` or `npm run latest` to import a dataset and create its compressed export.

See the [usage guide](docs/usage.md), [command index](bin/README.md), and [release notes](RELEASE_NOTES.md). Find all user guides in the [documentation index](docs/README.md).

## Development

Use native ESM for maintained JavaScript modules. Read [AGENTS.md](AGENTS.md) for contributor instructions and the [specification index](specs/README.md) for repository rules.

## Testing

Run `npm test` from the repository root for aggregate validation.

## Troubleshooting

See the [troubleshooting guide](docs/troubleshooting.md) for setup, download, import, and export errors.

## Security

Keep `.env`, downloaded datasets, and generated exports out of Git. A repeated MySQL import drops and recreates the database for that date.

## Configuration

See the [configuration table](docs/usage.md#install-and-configure) for defaults and required settings.

## Operations

See the [usage guide](docs/usage.md#select-a-dataset) for dataset selection, output names, and cleanup behavior.

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
