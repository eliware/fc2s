# FAA CSV to SQL (Node.js) Specification

## Purpose

Create an ESM-only Node.js project that downloads FAA NASR aeronautical data and imports each dataset using either MySQL or SQLite. MySQL exports one SQL file per table in a gzip-compressed tar archive. SQLite exports one gzip-compressed database file.

The project must use `.mjs` files exclusively for application code and examples. Source code belongs in `src/`; executable entry points belong in `examples/`.

## Project layout

- `src/`: reusable implementation modules
- `examples/`: executable entry points demonstrating latest, current, and all dataset processing
- `cache/`: optional runtime cache directory; create it when needed
- `spec.md`: this specification
- `package.json`: ESM Node.js package configuration

Do not use CommonJS, `require`, `.cjs`, or `.js` application files. Use `import`/`export` syntax and explicit file extensions in local imports.

## Runtime requirements

Require Node.js 24.15 or newer with native ESM support. Use `dotenv` to load configuration from a project-root `.env` file. When `DB_DRIVER=mysql`, the file must define:

- `MYSQL_HOSTNAME`
- `MYSQL_USERNAME`
- `MYSQL_PASSWORD`

Never commit `.env`; provide `.env.example` documenting the required variables. These values must be loaded before database configuration is validated.

MySQL credentials are required only when `DB_DRIVER=mysql`. The SQLite backend uses Node's built-in `node:sqlite` module and requires Node.js 24.15 or newer.

The MySQL backend also requires these system capabilities:

- MySQL-compatible server
- `mysql` client or equivalent SQL execution capability
- `mysqldump` executable
- `tar` executable with gzip support

Use the `.env` variables above as the default database credentials. Optional non-secret settings may use an explicit configuration object or additional environment variables. Never hard-code credentials in source or pass passwords in a way that unnecessarily exposes them in process listings.

## Main workflow

For a requested dataset date:

1. Obtain the FAA NASR subscription page over HTTPS.
2. Parse available Preview, Current, and Archive dataset dates.
3. Select the requested date:
   - `latest`: newest published dataset
   - `current`: current operational dataset, falling back according to FAA page data
   - `all`: process every discovered dataset, oldest first or in a documented deterministic order
4. Construct the FAA ZIP URL for the selected date.
5. Download the ZIP into a unique temporary directory.
6. Validate the HTTP response and downloaded file before processing.
7. Extract the ZIP safely, rejecting archive path traversal.
8. Locate FAA schema CSV files and table CSV files.
9. Parse table and column definitions from the FAA schema.
10. For MySQL, generate MySQL CREATE TABLE and bulk-load statements, create or replace a database named `<prefix><YYYY-MM-DD>`, and execute statements with local infile enabled.
11. For SQLite, create a local database named `<db_name>.sqlite`, create the schema, and insert CSV rows with prepared statements in a transaction. Store FAA values as text to preserve their source representation.
12. Create/update an index database and index table recording dataset name, import time, and preview status for the selected backend where applicable.
13. Create a temporary output subdirectory named for the database, for example:
    `exports/<db_name>/`
14. For MySQL, dump every table in the database into its own file:
    `exports/<db_name>/<table_name>.sql`
    Each file must contain a valid standalone SQL dump for that table, including table creation and table data where supported.
15. Create a MySQL archive named `exports/<db_name>.sql.tar.gz` containing the per-table SQL files, with stable archive-relative names and no unwanted absolute paths. For SQLite, gzip the database file to `exports/<db_name>.sqlite.gz`.
16. After successful archive/compression and validation, delete the temporary output subdirectory.
17. Always remove the download ZIP, extracted dataset, generated temporary files, and other process-owned temporary paths, including after failures where practical.
18. Return a success/failure result and useful error details without swallowing the original failure.

## Dumping and archive behavior

The backend determines the final artifact. MySQL creates `<db_name>.sql.tar.gz` containing one SQL file per table; do not create one combined SQL dump. SQLite creates `<db_name>.sqlite.gz`, which decompresses to a single standalone SQLite database file.

Use safe child-process APIs rather than shell-string concatenation. Validate database and table identifiers before using them in commands. Avoid putting passwords directly in command-line arguments; prefer a temporary protected MySQL option file or supported environment mechanism, and remove it during cleanup.

Only remove the temporary output subdirectory after the selected archive or compression command succeeds and the output exists with a nonzero size. If archiving or compression fails, preserve the subdirectory for diagnosis unless configuration explicitly requests aggressive cleanup.

## Configuration

Support configuration equivalent to:

- `driver` (`mysql` or `sqlite`, default `mysql`, from `DB_DRIVER`)
- `host` (loaded from `MYSQL_HOSTNAME`)
- `port`
- `user` (loaded from `MYSQL_USERNAME`)
- `password` (loaded from `MYSQL_PASSWORD`)
- `prefix`
- `exportDir`
- optional FAA URL, temporary directory, and cleanup controls

MySQL values are required and validated only when the selected driver is `mysql`. The `.env` configuration and required variable names must be documented in the README and examples.

## Modules

Suggested modules:

- `src/fetch-faa.mjs`: FAA page retrieval, date parsing, URL generation
- `src/https.mjs`: HTTPS requests and streaming downloads
- `src/schema.mjs`: schema CSV parsing and SQL generation
- `src/mysql.mjs`: connection, database/table operations, statement execution
- `src/sqlite.mjs`: SQLite schema creation and transactional CSV import
- `src/dump.mjs`: table discovery and per-table SQL dumping
- `src/archive.mjs`: tar.gz creation and SQLite gzip compression
- `src/files.mjs`: temporary directories, safe extraction, recursive cleanup
- `src/process.mjs`: orchestration and public latest/current/all operations
- `src/errors.mjs`: typed application errors

The exact module names may vary, but responsibilities should remain separated and testable.

## Error handling and safety

- Fail on network errors, non-success HTTP statuses, malformed FAA data, missing schema files, failed SQL, failed dumps, and failed archive creation.
- Preserve error causes when wrapping errors.
- Use unique temporary directories and never delete paths outside the process-owned temp root.
- Escape SQL values and identifiers correctly. Do not trust FAA filenames or schema values blindly.
- Handle CRLF/LF CSV files and quoted CSV fields.
- Ensure cleanup runs with `try/finally`.
- Avoid logging passwords or sensitive configuration.

## Entry points

Provide `.mjs` examples for:

- processing the latest dataset
- processing the current dataset
- processing all available datasets

Each entry point should load configuration, invoke the process API, print concise progress/errors, and exit nonzero on failure.

## Quality requirements

Include a README with installation, system dependencies, `.env` configuration, usage, output format, and cleanup behavior.

### Linting

Use Oxlint as the project linter. Add it as a development dependency and provide these npm scripts:

- `lint`: run Oxlint against the project while excluding `node_modules`
- `lint:fix`: optionally run Oxlint with automatic fixes

Use local npm binaries from scripts; do not depend on globally installed tools or `npx`. Keep lint configuration in a repository config file if custom rules are needed. All application, example, and test files must be lintable ESM `.mjs` files.

### Testing

Use Jest as the test runner and add it as a development dependency. Configure Jest for Node.js and native ESM:

- keep `"type": "module"` in `package.json`
- use `jest.config.mjs` when configuration is needed
- set the test environment to `node`
- disable transforms unless explicitly required, using an empty transform configuration
- run Jest through Node with `--experimental-vm-modules`
- use `--runInBand` for deterministic filesystem, archive, and database integration tests
- enable coverage in the normal test script
- use `--detectOpenHandles` when diagnosing leaked resources; it may be separated into a debug script
- do not use `--silent` by default

Provide npm scripts such as:

- `test`: run the ESM Jest suite with coverage
- `test:debug`: run tests with open-handle detection

Tests must use `.mjs` files and cover date parsing, URL generation, schema parsing, identifier validation, archive layout, error handling, and cleanup.
