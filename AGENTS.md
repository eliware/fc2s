# AGENTS.md

## Project

FC2S imports FAA NASR CSV datasets into MySQL or SQLite and creates compressed exports. Eliware owns this repository.

## Scope and boundaries

Keep user documentation in README.md and docs/. Keep behavior requirements in docs/requirements.md. Keep specifications in specs/.

## Layout

Keep implementation modules in src/, launchers in bin/, tests in tests/, fixtures in test-fixtures/, and examples in examples/. Use the README indexes in docs/, bin/, and specs/ to find maintained files.

## Development

Use Node.js 26 and native ESM for maintained JavaScript modules. Install dependencies with `npm ci` before development.

## Validation

Use Node.js 26 or later and npm 12 or later. Run `npm test` for aggregate validation. Run `npm run lint` for lint checks. Run `npm run audit` for dependency checks. Run `npm run format` to format files. Run `npm run format:check` to check formatting.

## Security

Keep credentials, downloaded datasets, and generated exports out of Git. Store MySQL credentials in a local `.env` file.

## Changes

Update RELEASE_NOTES.md for user-visible changes. Keep generated data and dependency artifacts out of source changes.

## Application

Run focused tests first during development. Pass one or more test paths to `npm test` for focused testing.

Run one test file with `npm test -- tests/path/to/example.test.mjs`. Run multiple test files with `npm test -- tests/path/to/first.test.mjs tests/path/to/second.test.mjs`.

Prevent repeated full-suite runs during development. Run the full `npm test` suite for final validation before a commit, milestone, or release.
