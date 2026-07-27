import 'dotenv/config';

export function config(overrides = {}) {
  const values = {
    host: process.env.MYSQL_HOSTNAME,
    user: process.env.MYSQL_USERNAME,
    password: process.env.MYSQL_PASSWORD,
    port: Number(process.env.MYSQL_PORT || 3306),
    prefix: process.env.NASR_PREFIX || 'NASR_',
    exportDir: process.env.EXPORT_DIR || './exports',
    ...overrides,
  };

  for (const key of ['host', 'user', 'password']) {
    if (values[key] === undefined) {
      const envKey = key === 'host' ? 'HOSTNAME' : key === 'user' ? 'USERNAME' : 'PASSWORD';
      throw new Error(`Missing MYSQL_${envKey}`);
    }
  }
  return values;
}
