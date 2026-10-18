# Troubleshooting

Run `npm ci`, then `npm test`. If `DB_DRIVER=mysql`, confirm the MySQL server
and credentials. If `DB_DRIVER=sqlite`, confirm the installed Node.js version
is 24.15 or newer and that `EXPORT_DIR` is writable.
