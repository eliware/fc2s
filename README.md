# FC2S.js

Package description: Node.js ESM tool that imports FAA NASR CSV data into MySQL and exports each database table as a gzip tar archive.

Documentation: [docs](docs/README.md) · [specifications](specs/README.md) · [examples](examples/README.md)

Node.js ESM importer for FAA NASR CSV datasets. Choose MySQL, which produces one
SQL dump per table in `<db_name>.sql.tar.gz`, or SQLite, which produces one
database file compressed as `<db_name>.sqlite.gz`.

Install with `npm install`. Set `DB_DRIVER=mysql` or `DB_DRIVER=sqlite` in `.env`.
For MySQL, also set `MYSQL_HOSTNAME`, `MYSQL_USERNAME`, and `MYSQL_PASSWORD`.
SQLite runs locally and does not need MySQL credentials. Run
`node examples/get_current.mjs`; see [usage](docs/usage.md) for details.

Lint: `npm run lint`. Test: `npm test`.
