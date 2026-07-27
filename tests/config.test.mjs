import { config } from '../src/config.mjs';

test('config accepts overrides', () => {
  expect(config({ host: 'h', user: 'u', password: 'p', port: 3307 }).port).toBe(3307);
});
test('config requires credentials', () => {
  expect(() => config({ host: undefined, user: undefined, password: undefined })).toThrow('Missing MYSQL_');
});

test('config uses environment defaults and overrides optional values', () => {
  const saved = { ...process.env };
  process.env.MYSQL_HOSTNAME = 'env-host';
  process.env.MYSQL_USERNAME = 'env-user';
  process.env.MYSQL_PASSWORD = 'env-pass';
  process.env.MYSQL_PORT = '3308';
  process.env.NASR_PREFIX = 'X_';
  process.env.EXPORT_DIR = '/tmp/x';
  expect(config()).toMatchObject({ host: 'env-host', user: 'env-user', password: 'env-pass', port: 3308, prefix: 'X_', exportDir: '/tmp/x' });
  process.env = saved;
});

test.each(['host', 'user', 'password'])('config reports missing %s', (key) => {
  const values = { host: 'h', user: 'u', password: 'p' };
  values[key] = undefined;
  expect(() => config(values)).toThrow(`Missing MYSQL_${key === 'host' ? 'HOSTNAME' : key === 'user' ? 'USERNAME' : 'PASSWORD'}`);
});

test('config applies optional defaults', () => {
  const saved = { ...process.env };
  for (const key of ['MYSQL_HOSTNAME', 'MYSQL_USERNAME', 'MYSQL_PASSWORD', 'MYSQL_PORT', 'NASR_PREFIX', 'EXPORT_DIR']) delete process.env[key];
  expect(config({ host: 'h', user: 'u', password: 'p' })).toMatchObject({ port: 3306, prefix: 'NASR_', exportDir: './exports' });
  process.env = saved;
});
