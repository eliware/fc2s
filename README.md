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

FC2S downloads FAA NASR datasets, imports CSV tables, and creates compressed MySQL or SQLite exports.

## Requirements

Use Node.js 26 or later and npm 12 or later. MySQL imports require a MySQL-compatible server and `mysqldump`. SQLite uses Node.js built-in `node:sqlite`.

## Setup

Run `npm ci` from the repository root. Copy `.env.example` to `.env` and configure the selected backend.

## Usage

Run `npm run get:dates` to list FAA release dates. Run `npm run current` or `npm run latest` to import a dataset.

See [usage](docs/usage.md), the [documentation index](docs/README.md), [command line tools](bin/README.md), and [release notes](RELEASE_NOTES.md).

## Development

Read [AGENTS.md](AGENTS.md) for contributor instructions and [specifications](specs/README.md) for repository requirements.

## Testing

Run `npm test` for aggregate validation.

## Troubleshooting

See [troubleshooting](docs/troubleshooting.md) for common setup and runtime errors.

## Security

Keep credentials, downloaded datasets, and generated exports out of Git. Store MySQL credentials in the local `.env` file.

## Configuration

See the [configuration table](docs/usage.md#install-and-configure) for environment variables, defaults, and required values.

## Operations

Run the CLI to import current, latest, date-specific, or all datasets. See [usage](docs/usage.md) for commands and output details.

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
