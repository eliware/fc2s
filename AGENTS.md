# AGENTS.md

## Project

FC2S imports FAA NASR CSV datasets into MySQL or SQLite and creates compressed exports. Eliware owns this repository.

## Scope and boundaries

Keep end-user documentation in `README.md` and `docs/`. Keep behavior requirements in `docs/requirements.md`. Keep repository specifications in `specs/`.

## Layout

Keep implementation modules in `src/`, launchers in `bin/`, tests in `tests/`, and fixtures in `test-fixtures/`. Use the README indexes in `docs/`, `bin/`, and `specs/` to find maintained files.

## Development

Use Node.js 26 or newer and native ESM. Run `npm ci` before development.

## Validation

Run `npm test` for aggregate validation. Run `npm run lint` for lint checks. Run `npm run audit` for dependency checks. Run `npm run format` to format files. Run `npm run format:check` to check formatting.

## Security

Keep credentials, downloaded datasets, and generated exports out of Git. Store MySQL credentials in the local `.env` file.

## Changes

Update `RELEASE_NOTES.md` for each user-visible change.

## Application

Run focused tests first during development. Pass one or more test paths to `npm test`.

Run one test file with `npm test -- tests/path/to/example.test.mjs`. Run multiple test files with `npm test -- tests/path/to/first.test.mjs tests/path/to/second.test.mjs`.

Prevent repeated full-suite runs during development. Run the full `npm test` suite for final validation before a commit, milestone, or release.
