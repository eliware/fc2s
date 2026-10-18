# Examples

- [Basic example](basic.mjs)
- [SQLite current dataset](get_sqlite_current.mjs)

The existing `get_current.mjs`, `get_latest.mjs`, and `get_all.mjs` commands
use `DB_DRIVER` from `.env`. MySQL requires its configured server and
credentials; SQLite requires Node.js 24.15 or newer and writes a compressed
database file under `exports/`. Generated temporary files are removed after a
successful export.
