# FAA CSV to SQL (Node.js) Specification

## Purpose

Create an ESM-only Node.js project that downloads FAA NASR aeronautical data, imports each dataset into MySQL, exports every database table into a separate SQL file, and packages those files as a gzip-compressed tar archive.

The project must use `.mjs` files exclusively for application code and examples. Source code belongs in `src/`; executable entry points belong in `examples/`.

## Project layout

- `src/`: reusable implementation modules
- `examples/`: executable entry points demonstrating latest, current, and all dataset processing
- `cache/`: optional runtime cache directory; create it when needed
- `spec.md`: this specification
- `package.json`: ESM Node.js package configuration

Do not use CommonJS, `require`, `.cjs`, or `.js` application files. Use `import`/`export` syntax and explicit file extensions in local imports.

## Runtime requirements

Require a current Node.js release with native ESM support. Use `dotenv` to load configuration from a project-root `.env` file. The `.env` file must define:

- `MYSQL_HOSTNAME`
- `MYSQL_USERNAME`
- `MYSQL_PASSWORD`

Never commit `.env`; provide `.env.example` documenting the required variables. These values must be loaded before database configuration is validated.

Also require these system capabilities:

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
9. Generate MySQL CREATE TABLE and bulk-load statements from the FAA schema.
10. Create or replace a database named `<prefix><YYYY-MM-DD>`.
11. Create/update an index database and index table recording dataset name, import time, and preview status.
12. Execute schema and import statements with local infile enabled.
13. Create a temporary dump subdirectory named for the database, for example:
    `exports/<db_name>/`
14. Dump every table in the database into its own file:
    `exports/<db_name>/<table_name>.sql`
    Each file must contain a valid standalone SQL dump for that table, including table creation and table data where supported.
15. Create:
    `exports/<db_name>.tar.gz`
    containing the per-table SQL files, with stable archive-relative names and no unwanted absolute paths.
16. After successful tarball creation, delete the dump subdirectory and all individual `.sql` files.
17. Always remove the download ZIP, extracted dataset, generated temporary files, and other process-owned temporary paths, including after failures where practical.
18. Return a success/failure result and useful error details without swallowing the original failure.

## Dumping and archive behavior

The tarball is the final artifact. It must be named exactly `<db_name>.tar.gz` and contain one SQL file per database table. Do not create one combined SQL dump.

Use safe child-process APIs rather than shell-string concatenation. Validate database and table identifiers before using them in commands. Avoid putting passwords directly in command-line arguments; prefer a temporary protected MySQL option file or supported environment mechanism, and remove it during cleanup.

Only remove generated SQL files and the dump subdirectory after the tar command succeeds and the archive exists with a nonzero size. If archiving fails, preserve the dump directory for diagnosis unless configuration explicitly requests aggressive cleanup.

## Configuration

Support configuration equivalent to:

- `host` (loaded from `MYSQL_HOSTNAME`)
- `port`
- `user` (loaded from `MYSQL_USERNAME`)
- `password` (loaded from `MYSQL_PASSWORD`)
- `prefix`
- `exportDir`
- optional FAA URL, temporary directory, and cleanup controls

The `.env` configuration and required variable names must be documented in the README and examples. Validate all required values before connecting.

## Modules

Suggested modules:

- `src/fetch-faa.mjs`: FAA page retrieval, date parsing, URL generation
- `src/https.mjs`: HTTPS requests and streaming downloads
- `src/schema.mjs`: schema CSV parsing and SQL generation
- `src/mysql.mjs`: connection, database/table operations, statement execution
- `src/dump.mjs`: table discovery and per-table SQL dumping
- `src/archive.mjs`: tar.gz creation
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
