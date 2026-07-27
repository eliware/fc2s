# AGENTS.md

## Project
FC2S.js: ESM-only Node.js application that downloads FAA NASR CSV datasets, imports them into MySQL, and creates per-table SQL tarballs.

## Source of truth
`spec.md` is authoritative for required behavior, architecture, safety, configuration, CLI examples, testing, linting, cleanup, and output format. When code, README, or this file conflicts with `spec.md`, follow `spec.md` and update the conflicting implementation/documentation.

## Structure
- `src/`: reusable ESM `.mjs` modules
- `examples/`: executable `.mjs` entry points
- `test/`: Jest ESM tests
- `spec.md`: authoritative specification
- `exports/`: generated `.tar.gz` artifacts (ignored)
- `cache/`: optional runtime cache (ignored)

## Development rules
- Use Node.js native ESM only: `import`/`export`, explicit local `.mjs` extensions.
- Do not add CommonJS, `require`, `.cjs`, or application `.js` files.
- Keep responsibilities separated and modules testable.
- Preserve error causes; fail clearly on network, CSV, SQL, dump, archive, and cleanup errors.
- Use safe child-process APIs; never shell-concatenate untrusted values.
- Validate database/table identifiers and archive paths.
- Never log or commit credentials. Load required MySQL values from root `.env` via `dotenv`.
- Use unique temporary directories and `try/finally` cleanup. Preserve failed dump directories for diagnosis unless explicitly configured otherwise.
- Do not modify generated artifacts or dependencies unnecessarily.

## Commands
- Install: `npm install`
- Lint: `npm run lint`
- Lint fix: `npm run lint:fix`
- Tests: `npm test`
- Debug tests: `npm run test:debug`
- Current: `node examples/get_current.mjs`
- Latest: `node examples/get_latest.mjs`
- All: `node examples/get_all.mjs`
- Specific date: `node examples/get_date.mjs YYYY-MM-DD`

## Required configuration
Copy `.env.example` to `.env` and set:
`MYSQL_HOSTNAME`, `MYSQL_USERNAME`, `MYSQL_PASSWORD`.
Optional settings include `MYSQL_PORT`, `NASR_PREFIX`, and `EXPORT_DIR`.

## Change checklist
1. Read `spec.md` before changing behavior.
2. Add/update `.mjs` tests for behavior and failure paths.
3. Run `npm test` and `npm run lint`.
4. Keep README, examples, and config documentation aligned with `spec.md`.
