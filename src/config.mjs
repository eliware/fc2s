import 'dotenv/config';
export function config(overrides = {}) {
  const c = { host: process.env.MYSQL_HOSTNAME, user: process.env.MYSQL_USERNAME, password: process.env.MYSQL_PASSWORD, port: Number(process.env.MYSQL_PORT || 3306), prefix: process.env.NASR_PREFIX || 'NASR_', exportDir: process.env.EXPORT_DIR || './exports', ...overrides };
  for (const k of ['host','user','password']) if (c[k] === undefined) throw new Error(`Missing MYSQL_${k === 'host' ? 'HOSTNAME' : k === 'user' ? 'USERNAME' : 'PASSWORD'}`);
  return c;
}
