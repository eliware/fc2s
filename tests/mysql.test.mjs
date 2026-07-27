import { EventEmitter } from 'node:events';
import { db, dumpTable, run } from '../src/mysql.mjs';

function child({ output = '', error = '', code = 0 } = {}) {
  const p = new EventEmitter();
  p.stdout = new EventEmitter(); p.stderr = new EventEmitter();
  queueMicrotask(() => {
    if (output) p.stdout.emit('data', output);
    if (error) p.stderr.emit('data', error);
    p.emit('close', code);
  });
  return p;
}

test('db uses injected mysql client and stream factory', async () => {
  const connection = {};
  const createReadStream = (file) => file;
  const mysql = { createConnection: (options) => { connection.options = options; return connection; } };
  expect(db({ host: 'h', port: 1, user: 'u', password: 'p' }, { mysql, createReadStream }).options).toMatchObject({ host: 'h', port: 1, user: 'u', password: 'p' });
  expect(connection.options.infileStreamFactory('x')).toBe('x');
});

test('run captures output and injected spawn failures', async () => {
  await expect(run('x', [], {}, { spawn: () => child({ output: 'ok' }) })).resolves.toBe('ok');
  await expect(run('x', [], {}, { spawn: () => child({ error: 'bad', code: 2 }) })).rejects.toThrow('bad');
  const failing = new EventEmitter();
  await expect(run('x', [], {}, { spawn: () => { queueMicrotask(() => failing.emit('error', new Error('spawn failed'))); return failing; } })).rejects.toThrow('spawn failed');
});

test('dumpTable uses injected process and pipeline', async () => {
  const calls = [];
  const stream = {};
  const spawn = (command, args, options) => { calls.push({ command, args, options }); return child({ output: 'SQL' }); };
  const pipeline = async (input, output) => { expect(input).toBeDefined(); expect(output).toBe(stream); };
  await dumpTable({ host: 'h', port: 3306, user: 'u', password: 'p' }, 'db', 'table', 'x.sql', { spawn, pipeline, createWriteStream: () => stream });
  expect(calls[0].args).toContain('--password=p');
  expect(calls[0].args).toContain('table');
});

test('dumpTable reports injected command failure', async () => {
  await expect(dumpTable({ host: 'h', port: 3306, user: 'u', password: 'p' }, 'db', 't', 'x', {
    spawn: () => child({ error: 'dump failed', code: 3 }),
    pipeline: async () => {}, createWriteStream: () => ({}),
  })).rejects.toThrow('dump failed');
});

test('run uses fallback command error when stderr is empty', async () => {
  await expect(run('x', [], {}, { spawn: () => child({ code: 2 }) })).rejects.toThrow('command failed: 2');
});

test('run handles children without output streams', async () => {
  const p = new EventEmitter();
  queueMicrotask(() => p.emit('close', 0));
  await expect(run('x', [], {}, { spawn: () => p })).resolves.toBe('');
});

test('dumpTable uses fallback error when stderr is empty', async () => {
  await expect(dumpTable({ host: 'h', port: 3306, user: 'u', password: 'p' }, 'db', 't', 'x', {
    spawn: () => child({ code: 3 }),
    pipeline: async () => {}, createWriteStream: () => ({}),
  })).rejects.toThrow('mysqldump failed: 3');
});

test('db uses default read stream dependency', async () => {
  const mysql = { createConnection: (options) => options };
  const options = db({ host: 'h', port: 1, user: 'u', password: 'p' }, { mysql });
  const stream = options.infileStreamFactory('/dev/null');
  expect(stream).toBeDefined();
  stream.destroy();
});

test('run uses the default spawn implementation', async () => {
  await expect(run(process.execPath, ['-e', 'process.stdout.write("ok")'])).resolves.toBe('ok');
});

test('dumpTable uses default pipeline and write stream', async () => {
  const { PassThrough } = await import('node:stream');
  const root = await (await import('node:fs/promises')).mkdtemp('/tmp/fc2s-mysql-');
  const file = `${root}/dump.sql`;
  const output = new PassThrough();
  const spawn = () => {
    const p = child();
    p.stdout = output;
    queueMicrotask(() => { output.end('SQL'); p.emit('close', 0); });
    return p;
  };
  await dumpTable({ host: 'h', port: 3306, user: 'u', password: 'p' }, 'db', 't', file, { spawn });
  expect(await (await import('node:fs/promises')).readFile(file, 'utf8')).toBe('SQL');
  await (await import('node:fs/promises')).rm(root, { recursive: true, force: true });
});

test('db rejects with default mysql client when connection fails', async () => {
  await expect(db({ host: '127.0.0.1', port: 1, user: 'invalid', password: 'invalid' })).rejects.toBeDefined();
});

test('dumpTable selects default process dependencies', async () => {
  await expect(dumpTable(
    { host: '127.0.0.1', port: 1, user: 'invalid', password: 'invalid' },
    'db', 't', '/tmp/fc2s-missing-dump.sql',
  )).rejects.toBeDefined();
});
