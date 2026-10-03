# FC2S.js

Package description: Node.js ESM tool that imports FAA NASR CSV data into MySQL and exports each database table as a gzip tar archive.

Documentation: [docs](docs/README.md) · [specifications](specs/README.md) · [examples](examples/README.md)

Node.js ESM implementation of FAA NASR CSV to MySQL and per-table `.tar.gz` export.

Install: `npm install`; copy `.env.example` to `.env`; set MySQL values. Run `node examples/get_current.mjs` (or `get_latest.mjs`, `get_all.mjs`).

Lint: `npm run lint`. Test: `npm test`.
