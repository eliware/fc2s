# AGENTS.md

## Project

See README.md for repository purpose, ownership, and scope.

## Scope and boundaries

Keep behavior requirements in docs/requirements.md. Keep usage instructions in README.md and docs/.

## Layout

Keep implementation modules in src/, executable examples in examples/, and tests in tests/.
Use docs/README.md, examples/README.md, and specs/README.md to find maintained files.

## Development

Use Node.js 26 and native ESM for maintained JavaScript modules.

## Validation

Use Node.js 26 or later and npm 12 or later.
Run `npm test` for aggregate validation.
Run `npm run lint` for lint checks.
Run `npm run audit` for dependency checks.
Run `npm run format` to format files.
Run `npm run format:check` to check formatting.

## Security

Keep credentials, secret values, downloaded datasets, and generated exports out of Git.
Keep MySQL credentials in a local `.env` file. SQLite runs without database credentials.

## Changes

Update RELEASE_NOTES.md for user-visible changes. Keep generated data and dependency artifacts out of source changes.

## Application

Run focused tests first during development.
Run one test file with `npm test -- tests/path/to/example.test.mjs`.
Run multiple test files with `npm test -- tests/path/to/first.test.mjs tests/path/to/second.test.mjs`.
Prevent repeated full-suite runs during development.
Run the full `npm test` suite for final validation before a commit, milestone, or release.
